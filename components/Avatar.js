export default function Avatar({ profile, size = 140 }) {
  const initials = (profile.display_name || '?').split(' ').slice(0, 2).map((w) => w.charAt(0)).join('')
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size / 3 }}>
      {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} /> : initials}
    </div>
  )
}
