import config from '../config';

export async function changePassword({ token, hashedPassword, salt }) {
	const res = await fetch(`${config.API_URL}/users/password`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify({ password: hashedPassword, salt }),
	});
	if (!res.ok) {
		let msg = 'Failed to change password';
		try { const data = await res.json(); msg = data.error || msg; } catch {}
		throw new Error(msg);
        
	}
	return res.json();
}
