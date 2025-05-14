// utils/generateGuestName.js
const adjectives = [
  'Lazy', 'Happy', 'Sleepy', 'Brave', 'Silly', 'Clever', 'Fuzzy', 'Noisy', 'Bouncy', 'Shy'
];

const animals = [
  { name: 'Llama', emoji: '🦙', color: '#d1a' },
  { name: 'Hippo', emoji: '🦛', color: '#666' },
  { name: 'Panda', emoji: '🐼', color: '#000' },
  { name: 'Koala', emoji: '🐨', color: '#aaa' },
  { name: 'Penguin', emoji: '🐧', color: '#2c3e50' },
  { name: 'Otter', emoji: '🦦', color: '#8e44ad' },
  { name: 'Tiger', emoji: '🐯', color: '#e67e22' },
  { name: 'Moose', emoji: '🦌', color: '#795548' },
  { name: 'Monkey', emoji: '🐵', color: '#9c27b0' },
  { name: 'Giraffe', emoji: '🦒', color: '#f4a261' }
];

export function generateGuestName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return {
    name: `${adj} ${animal.name}`,
    emoji: animal.emoji,
    color: animal.color
  };
}
