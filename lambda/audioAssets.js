const BUCKET_URL = process.env.S3_BUCKET_URL || 'https://nighttime-skill-audio.s3.amazonaws.com';

/** Short clip played before launch speech (SSML `<audio>`). Host at audio/intro.mp3 on the bucket. */
const INTRO_MP3_URL = `${BUCKET_URL}/audio/intro.mp3`;

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
  },
  'reality check': {
    key: 'reality-check',
    url: `${BUCKET_URL}/audio/reality-check.mp3`,
    title: 'Reality Check',
    subtitle: 'Grounding and presence'
  }
};

// Full-screen art while this track plays (Echo Show / Fire TV). Host at images/{key}.png on the same bucket.
for (const sound of Object.values(SOUNDS)) {
  sound.backgroundUrl = `${BUCKET_URL}/images/${sound.key}.png`;
}

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
  street: 'city sounds',
  'reality-check': 'reality check',
  grounding: 'reality check',
  presence: 'reality check'
};

function resolveSound(slotValue) {
  if (!slotValue) return null;
  const normalized = slotValue.toLowerCase().trim();
  if (SOUNDS[normalized]) return SOUNDS[normalized];
  const mapped = SYNONYM_MAP[normalized];
  return mapped ? SOUNDS[mapped] : null;
}

const SOUND_LIST = Object.values(SOUNDS);

/**
 * Stream token used in AudioPlayer.Play. Prefix bumps invalidate Alexa metadata cache
 * (same logical track key used to cache art/title for up to ~5 days).
 */
const STREAM_TOKEN_PREFIX = 'ntv6:';

function streamToken(sound) {
  return `${STREAM_TOKEN_PREFIX}${sound.key}`;
}

function soundFromStreamToken(token) {
  if (!token) return null;
  if (token.startsWith(STREAM_TOKEN_PREFIX)) {
    const key = token.slice(STREAM_TOKEN_PREFIX.length);
    return SOUND_LIST.find(s => s.key === key) || null;
  }
  return SOUND_LIST.find(s => s.key === token) || null;
}

const TRANSPARENT_ART_URL = `${BUCKET_URL}/images/transparent.png`;

/** Now Playing screen: background only, all chrome minimized. */
function audioMetadataForSound(sound) {
  return {
    title: ' ',
    subtitle: ' ',
    art: {
      contentDescription: sound.title,
      sources: [{ url: TRANSPARENT_ART_URL }]
    },
    backgroundImage: {
      contentDescription: sound.title,
      sources: [{ url: sound.backgroundUrl }]
    }
  };
}

module.exports = {
  SOUNDS,
  SOUND_LIST,
  resolveSound,
  BUCKET_URL,
  INTRO_MP3_URL,
  audioMetadataForSound,
  streamToken,
  soundFromStreamToken
};
