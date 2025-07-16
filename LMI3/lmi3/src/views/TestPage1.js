import React, { useEffect, useState } from 'react';
import Switch from '@mui/material/Switch';

const TestPage1 = () => {
  const [users, setUsers] = useState([]);

  
  useEffect(() => {
    //Enn sachant que c'est l'ip sur le réseau local du serveur sur lequel cette merde tourne
    fetch("http://192.168.1.40:3001/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  return (
    <div>
      <h1>Test Page 1</h1>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.createdAt} {u.email}a</li>
        ))}
      </ul>
      <a>NIGGER</a>


      <Switch
     
      />

    </div>
  );
};

export default TestPage1;
