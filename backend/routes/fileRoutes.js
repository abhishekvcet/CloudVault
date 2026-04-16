const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, BUCKET_NAME } = require('../config/s3');
const { pool } = require('../config/db');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /files/upload — Upload file to S3
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const uniqueKey = `uploads/${req.user.id}/${uuidv4()}${fileExtension}`;

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(putCommand);

    // Generate URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueKey}`;

    // Save metadata to DB
    const [result] = await pool.query(
      'INSERT INTO files (filename, original_name, url, s3_key, file_size, mime_type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        `${uuidv4()}${fileExtension}`,
        file.originalname,
        fileUrl,
        uniqueKey,
        file.size,
        file.mimetype,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: result.insertId,
        original_name: file.originalname,
        url: fileUrl,
        size: file.size,
        mime_type: file.mimetype,
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);

    if (error.message && error.message.includes('File type')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /files — List all files for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [files] = await pool.query(
      'SELECT id, filename, original_name, url, file_size, mime_type, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );

    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// GET /files/download/:id — Get a presigned download URL
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];

    // Generate presigned URL (valid for 1 hour)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3_key,
      ResponseContentDisposition: `attachment; filename="${file.original_name}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    res.json({
      downloadUrl,
      filename: file.original_name,
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// DELETE /files/:id — Delete file from S3 and DB
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [files] = await pool.query(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3_key,
    });

    await s3Client.send(deleteCommand);

    // Delete from DB
    await pool.query('DELETE FROM files WHERE id = ?', [req.params.id]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
