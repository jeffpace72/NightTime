const BUCKET_URL = process.env.S3_BUCKET_URL || 'https://nighttime-skill-audio.s3.amazonaws.com';

const SOUNDS = {
  rain: {
    key: 'rain',
    url: `${BUCKET_URL}/audio/rain.mp3`,
    title: 'Rain',
    subtitle: 'Relaxing rainfall'
  },
  thunderstorm: {
    key: 'thunderstorm',
    url: `${BUCKET_URL}/audio/thunderstorm.mp3`,
    title: 'Thunderstorm',
    subtitle: 'Thunder and rain'
  },
  'ocean waves': {
    key: 'ocean-waves',
    url: `${BUCKET_URL}/audio/ocean-waves.mp3`,
    title: 'Ocean Waves',
    subtitle: 'Peaceful ocean waves'
  },
  jungle: {
    key: 'jungle',
    url: `${BUCKET_URL}/audio/jungle.mp3`,
    title: 'Jungle',
    subtitle: 'Jungle wildlife and sounds'
  },
  'city sounds': {
    key: 'city-sounds',
    url: `${BUCKET_URL}/audio/city-sounds.mp3`,
    title: 'City Sounds',
    subtitle: 'Urban city ambience'
  }
};

const SYNONYM_MAP = {
  raining: 'rain',
  rainfall: 'rain',
  rainy: 'rain',
  thunder: 'thunderstorm',
  storm: 'thunderstorm',
  lightning: 'thunderstorm',
  ocean: 'ocean waves',
  waves: 'ocean waves',
  sea: 'ocean waves',
  beach: 'ocean waves',
  forest: 'jungle',
  rainforest: 'jungle',
  nature: 'jungle',
  wildlife: 'jungle',
  city: 'city sounds',
  urban: 'city sounds',
  traffic: 'city sounds',
  street: 'city sounds'
};

function resolveSound(slotValue) {
  if (!slotValue) return null;
  const normalized = slotValue.toLowerCase().trim();
  if (SOUNDS[normalized]) return SOUNDS[normalized];
  const mapped = SYNONYM_MAP[normalized];
  return mapped ? SOUNDS[mapped] : null;
}

const SOUND_LIST = Object.values(SOUNDS);

module.exports = { SOUNDS, SOUND_LIST, resolveSound };
