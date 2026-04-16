export default function Navbar({ user, onLogout }) {
  const initial = user?.username?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">CV</div>
        <span className="navbar-title">CloudVault</span>
      </div>

      <div className="navbar-user">
        <span className="navbar-username">{user?.username}</span>
        <div className="navbar-avatar" title={user?.email}>{initial}</div>
        <button className="btn btn-ghost" onClick={onLogout} title="Sign out">
          ⏻
        </button>
      </div>
    </nav>
  );
}
