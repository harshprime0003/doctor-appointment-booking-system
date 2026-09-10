import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Avatar } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { titleCase } from '../utils/format.js';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <div className="menu" ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="tiny" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.name}
        </span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-panel">
          <div className="menu-header">
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div className="tiny muted">{user.email}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {titleCase(user.role)}
            </div>
          </div>
          <button
            className="menu-item"
            onClick={() => {
              setOpen(false);
              navigate('/app/profile');
            }}
          >
            <Icon name="user" size={15} /> Profile & settings
          </button>
          <button
            className="menu-item danger"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
