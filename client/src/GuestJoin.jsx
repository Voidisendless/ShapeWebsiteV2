import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateGuestName } from './utils/generateGuestName';

function GuestJoin() {
  const navigate = useNavigate();

  useEffect(() => {
    const existingGuest = localStorage.getItem('guestName');
    if (existingGuest) {
      navigate('/');
      return;
    }

    const guest = generateGuestName();
    localStorage.setItem('guestName', guest.name);
    localStorage.setItem('guestEmoji', guest.emoji);
    localStorage.setItem('guestColor', guest.color);
    navigate('/');
  }, [navigate]);

  return null; // nothing rendered
}

export default GuestJoin;
