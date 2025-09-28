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

export function normalizeSettingsArray(settingsArray) {
	const map = {};
	settingsArray.forEach(setting => {
		let val = setting.value;
		// Try to interpret JSON values (arrays/objects) saved as strings
		if (typeof val === 'string' && val.trim().startsWith('[')) {
			try {
				val = JSON.parse(val);
			} catch (e) {
				// fall back to string
			}
		}
		if (val === 'true') val = true;
		else if (val === 'false') val = false;
		else if (!isNaN(val) && val !== '') val = Number(val);
		map[setting.key] = val;
	});
	return map;
}
