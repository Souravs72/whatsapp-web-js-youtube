import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';
import Loader from './components/Loader';
import { userLists } from './data/Users';

const socket = io.connect("http://localhost:3001", {});

const App = () => {
  const [id, setId] = useState("");
  const [session, setSession] = useState("");
  const [qrCode, setQRCode] = useState('');
  const [oldSessionId, setOldSessionId] = useState('');
  const [qrCodeScanned, setQRCodeScanned] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState({ percent: 0, message: '' });

  const getOldSession = () => {
    socket.emit('getSession', { id: oldSessionId });
  };

  const createSession = () => {
    socket.emit('createSession', { id: session });
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      users: '',
      username: '',
      phoneNumber: '',
      message: ''
    }
  });

  const onSubmit = async (data) => {
    const { users, phoneNumber, message } = data;

    const selectedUser = usersList.find(user => user.id === parseInt(users));

    if (selectedUser) {
      try {
        console.log(`Sending message to ${selectedUser.username}, phone number: ${phoneNumber}`);
        await socket.emit('chat_message', { phoneNumber, message });
        console.log('Message sent successfully.');
      } catch (error) {
        console.error('Error occurred while sending message:', error);
      }
    }
  };

  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
  };

  useEffect(() => {
    socket.on('qr', ({ qr }) => {
      console.log('QR Code received:', qr); // Add this
      setQRCode(qr);
    });

    socket.on('ready', ({ id }) => {
      console.log('Ready event received, ID:', id); // Add this
      setId(id);
      setQRCodeScanned(true);
    });

    socket.on('loading_screen', ({ percent, message }) => {
      console.log('Loading screen event received:', { percent, message });
      setLoading({ percent, message });
    });

    socket.emit('connected', 'Hello from client');

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('loading_screen');
    };
  }, [qrCodeScanned]);

  useEffect(() => {
    const fetchedUsers = userLists;
    setUsersList(fetchedUsers);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const user = usersList.find(user => user.id === parseInt(selectedUser));
      console.log('Selected user:', user);
      if (user) {
        setValue("username", user.username);
        setValue("name", user.name);
        setValue("phoneNumber", user.mobileNumber);
      }
    }
  }, [selectedUser, setValue, usersList]);

  return (
    <div className="App">
      {loading.percent > 0 && loading.percent < 100 &&
        <div>
          <Loader loading={loading} />
        </div>
      }
      {id !== '' && qrCodeScanned &&
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="container" style={{ width: '500px' }} >
            <h1>Chat Form</h1>
            <form className="form" onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'flex flex-col' }}>
                <div>
                  {errors.users && <span className="error">Please select a user.</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="users">Users:</label>
                  <select id="users" {...register('users', { required: true })} onChange={handleUserChange}>
                    <option value="">Select a user</option>
                    {usersList.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="username">User Name:</label>
                <input type="text" id="username" {...register('username', { required: true })} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" {...register('name')} readOnly />
              </div>
              <div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number:</label>
                  <input type="text" id="phoneNumber" {...register('phoneNumber')} readOnly />
                </div>
              </div>
              <div className="form-group">
                <div>{errors.message && <span className="error">Message is required.</span>}</div>
                <div className="form-group">
                  <label htmlFor="message">Message:</label>
                  <textarea id="message" rows="4" {...register('message', { required: true })} />
                </div>
              </div>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      }
      {id === '' &&
        <div className='Flex'>
          <div className='container'>
            <h1>ClapGrow Whatsapp Client</h1>
            <p style={{ color: 'darkslateblue' }}>Open Whatsapp and scan qr code</p>
            <div className='container' style={{ marginTop: '2rem' }}>
              <label htmlFor="oldSessionId" className='label'>Input Old Session ID</label>
              <input className='input'
                type="text"
                value={oldSessionId}
                onChange={(e) => {
                  setOldSessionId(e.target.value);
                }}
              />
              <button onClick={getOldSession} className='button'>
                Get Old Session
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '22px', margin: '15px 0', color: 'red', fontWeight: 'bold' }}>
              OR
            </div>
            <div className='container'>
              <label htmlFor="oldSessionId" className='label'>Enter New Session ID</label>
              <input type="text" className='input' value={session}
                onChange={(e) => setSession(e.target.value)}
              />
              <button onClick={createSession} className='button'>
                Create Session
              </button>
            </div>
          </div>
          {qrCode === '' &&
            <Loader loading={loading} /> // Ensure loading is passed here as well
          }
          {qrCode !== '' &&
            <div className='container qr'>
              <p style={{ color: 'red', fontWeight: 'bold' }}>Scan this QR Code and login</p>
              <div className='container'>
                <QRCode value={qrCode} />
              </div>
            </div>
          }
        </div>
      }
    </div>
  );
};

export default App;