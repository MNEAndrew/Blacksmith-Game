interface UserMenuProps {
  username: string;
  reputation: number;
  onSignOut: () => void;
  busy: boolean;
}

export function UserMenu({ username, reputation, onSignOut, busy }: UserMenuProps) {
  return (
    <div className="user-menu" aria-label="Account menu">
      <div className="user-menu__info">
        <span className="user-menu__avatar" aria-hidden="true">⚒️</span>
        <div>
          <span className="user-menu__name">{username}</span>
          <span className="user-menu__rep">{Math.floor(reputation)} ⭐ synced</span>
        </div>
      </div>
      <button
        type="button"
        className="secondary-btn user-menu__logout"
        onClick={onSignOut}
        disabled={busy}
        aria-label="Sign out"
      >
        {busy ? '…' : 'Log Out'}
      </button>
    </div>
  );
}
