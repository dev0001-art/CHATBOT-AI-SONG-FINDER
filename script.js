const profileInputs = {
  name: document.querySelector("#nameInput"),
  language: document.querySelector("#languageInput"),
  genre: document.querySelector("#genreInput"),
};

const saveProfileBtn = document.querySelector("#saveProfileBtn");
const profileStatus = document.querySelector("#profileStatus");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const moodChips = document.querySelectorAll(".mood-chip");
const moreSongsBtn = document.querySelector("#moreSongsBtn");
const favoritesList = document.querySelector("#favoritesList");

const PROFILE_KEY = "vibetune-profile";
const FAVORITES_KEY = "vibetune-favorites";
const recommendationState = {
  message: "",
  moodKey: "",
  offset: 0,
  lastCount: 0,
  songQuery: "",
};

const languageConfigs = {
  English: { country: "US", hint: "english songs" },
  Hindi: { country: "IN", hint: "hindi songs bollywood" },
  Punjabi: { country: "IN", hint: "punjabi songs" },
};

const genreIntentMap = {
  new: ["new songs", "latest hits", "recent releases"],
  latest: ["latest songs", "new releases", "trending tracks"],
  old: ["old songs", "classic hits", "retro songs"],
  classic: ["classic songs", "timeless hits", "golden era songs"],
  party: ["party songs", "dance hits", "celebration songs"],
  dance: ["dance songs", "club hits", "party anthems"],
  sad: ["sad songs", "emotional songs", "heartbreak music"],
  romantic: ["romantic songs", "love songs", "soft romantic music"],
  chill: ["chill songs", "relaxing music", "easy listening"],
  lofi: ["lofi beats", "chill lofi", "study lofi"],
  study: ["study music", "focus songs", "concentration music"],
  workout: ["workout songs", "gym songs", "high energy tracks"],
  devotional: ["devotional songs", "spiritual music", "bhajan songs"],
  indie: ["indie songs", "indie pop", "independent music"],
  pop: ["pop songs", "popular hits", "pop music"],
  rock: ["rock songs", "rock anthems", "classic rock"],
  rap: ["rap songs", "hip hop hits", "rap music"],
  hiphop: ["hip hop songs", "rap hits", "hip hop music"],
};

const moodProfiles = {
  happy: {
    aliases: ["happy", "joyful", "good", "sunny", "cheerful", "excited"],
    searchTerms: ["upbeat pop", "feel good hits", "happy indie"],
    responseLead: "You sound bright and upbeat, so I leaned into warm hooks and energetic melodies.",
  },
  calm: {
    aliases: ["calm", "peaceful", "relaxed", "soft", "easy", "quiet"],
    searchTerms: ["chill acoustic", "soft ambient", "calm indie"],
    responseLead: "This feels like a softer mood, so I looked for gentler songs with room to breathe.",
  },
  heartbroken: {
    aliases: ["sad", "heartbroken", "down", "cry", "lonely", "broken"],
    searchTerms: ["sad songs", "melancholy pop", "emotional indie"],
    responseLead: "That mood deserves something honest, so these picks lean reflective and emotional.",
  },
  focused: {
    aliases: ["focused", "study", "work", "productive", "concentrate", "deep"],
    searchTerms: ["focus instrumental", "study beats", "ambient electronic"],
    responseLead: "You sound locked in, so I prioritized songs that help you stay steady.",
  },
  energetic: {
    aliases: ["energetic", "hyped", "gym", "power", "party", "fast"],
    searchTerms: ["workout hits", "dance pop", "high energy"],
    responseLead: "You want momentum, so I went for bigger rhythm and faster energy.",
  },
  romantic: {
    aliases: ["romantic", "love", "date", "crush", "dreamy", "intimate"],
    searchTerms: ["romantic songs", "dreamy pop", "love ballads"],
    responseLead: "That mood called for something warm and intimate, with a little glow to it.",
  },
};

const moodSignals = {
  happy: {
    phrases: [
      "feel good",
      "good mood",
      "cheer me up",
      "make me smile",
      "good vibes",
      "fun songs",
    ],
    words: [
      "happy",
      "joyful",
      "cheerful",
      "sunny",
      "bright",
      "smile",
      "fun",
      "playful",
      "positive",
      "celebration",
    ],
  },
  calm: {
    phrases: [
      "calm down",
      "relax me",
      "late night",
      "slow songs",
      "peaceful songs",
      "soft songs",
    ],
    words: [
      "calm",
      "peaceful",
      "relaxed",
      "soft",
      "quiet",
      "gentle",
      "slow",
      "chill",
      "soothing",
      "stress",
      "stressed",
    ],
  },
  heartbroken: {
    phrases: [
      "broken heart",
      "heart break",
      "miss someone",
      "crying songs",
      "sad songs",
      "feeling low",
    ],
    words: [
      "sad",
      "heartbroken",
      "down",
      "cry",
      "crying",
      "lonely",
      "broken",
      "hurt",
      "pain",
      "upset",
      "miss",
    ],
  },
  focused: {
    phrases: [
      "study music",
      "study songs",
      "work music",
      "deep focus",
      "help me focus",
      "concentration music",
    ],
    words: [
      "focused",
      "focus",
      "study",
      "work",
      "productive",
      "concentrate",
      "deep",
      "coding",
      "reading",
      "background",
    ],
  },
  energetic: {
    phrases: [
      "gym songs",
      "workout songs",
      "pump me up",
      "high energy",
      "party songs",
      "dance songs",
    ],
    words: [
      "energetic",
      "hyped",
      "gym",
      "power",
      "party",
      "fast",
      "workout",
      "dance",
      "boost",
      "motivation",
      "motivated",
      "running",
    ],
  },
  romantic: {
    phrases: [
      "love songs",
      "date night",
      "romantic songs",
      "for my crush",
      "falling in love",
      "dreamy songs",
    ],
    words: [
      "romantic",
      "love",
      "date",
      "crush",
      "dreamy",
      "intimate",
      "affection",
      "sweet",
      "loving",
    ],
  },
};

const messageStack = document.createElement("div");
messageStack.className = "message-stack";
chatLog.appendChild(messageStack);
let loadingMessageElement = null;

loadProfile();
seedIntro();
renderFavorites();

saveProfileBtn.addEventListener("click", () => {
  const profile = getProfile();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  profileStatus.textContent = `Saved for ${profile.name || "your next visit"}.`;
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  chatInput.value = "";
  appendMessage("user", message);
  await handleMoodRequest(message);
});

moodChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    const mood = chip.dataset.mood;
    const prompt = `I feel ${mood} right now. Recommend songs for me.`;
    appendMessage("user", prompt);
    await handleMoodRequest(prompt, mood);
  });
});

moreSongsBtn.addEventListener("click", async () => {
  if (!recommendationState.message || !recommendationState.moodKey) {
    appendMessage(
      "assistant",
      "Ask for songs first, then use More songs to get another batch."
    );
    return;
  }

  await handleMoreSongs();
});

function loadProfile() {
  const saved = localStorage.getItem(PROFILE_KEY);
  if (!saved) {
    return;
  }

  try {
    const profile = JSON.parse(saved);
    profileInputs.name.value = profile.name || "";
    profileInputs.language.value = profile.language || "";
    profileInputs.genre.value = profile.genre || "";
    profileStatus.textContent = `Welcome back${profile.name ? `, ${profile.name}` : ""}.`;
  } catch (error) {
    profileStatus.textContent = "";
  }
}

function getProfile() {
  return {
    name: profileInputs.name.value.trim(),
    language: profileInputs.language.value,
    genre: profileInputs.genre.value.trim(),
  };
}

function seedIntro() {
  appendMessage(
    "assistant",
    "Tell me your mood, energy, or situation, and I’ll turn it into Apple Music song recommendations. You can optionally save your name, language, and genre so the picks feel more like you."
  );
}

async function handleMoodRequest(message, forcedMood = "") {
  if (isGreetingMessage(message)) {
    const profile = getProfile();
    appendMessage("assistant", buildGreetingReply(profile));
    return;
  }

  const songIntent = extractSongIntent(message);
  const moodKey = forcedMood || detectMood(message) || inferMoodFromSongIntent(songIntent);

  if (!moodKey) {
    appendMessage(
      "assistant",
      "I can work with moods like happy, calm, energetic, heartbroken, focused, or romantic. You can also type a song name like “Pal Pal Dil Ke Paas” or say “songs like Tum Hi Ho.”"
    );
    return;
  }

  recommendationState.message = message;
  recommendationState.moodKey = moodKey;
  recommendationState.offset = 0;
  recommendationState.songQuery = songIntent;
  applyMoodTheme(moodKey);

  const profile = getProfile();
  const mood = moodProfiles[moodKey];
  const languageConfig = getLanguageConfig(profile.language);
  const genreHints = getGenreHints(profile.genre);
  const recommendationCount = getRecommendationCount(message);
  recommendationState.lastCount = recommendationCount;
  const searchTerms = [
    songIntent,
    buildDetailedQuery(message, profile, languageConfig),
    languageConfig.hint && genreHints.primary ? `${languageConfig.hint} ${genreHints.primary}` : "",
    languageConfig.hint,
    genreHints.primary,
    ...genreHints.related,
    ...mood.searchTerms,
  ].filter(Boolean);

  showLoadingMessage(buildMoodLeadLine(moodKey, songIntent));

  try {
    const tracks = await getRecommendations(searchTerms, languageConfig.country);
    hideLoadingMessage();
    if (!tracks.length) {
      appendMessage(
        "assistant",
        "I couldn’t find strong Apple Music matches right now. Try another mood, language, or genre."
      );
      return;
    }

    const intro = buildRecommendationIntro(moodKey, profile);
    appendMessage(
      "assistant",
      `${intro} I found ${Math.min(recommendationCount, tracks.length)} Apple Music songs based on your request.`,
      tracks.slice(0, recommendationCount)
    );
  } catch (error) {
    hideLoadingMessage();
    appendMessage(
      "assistant",
      "Apple Music didn’t respond the way I expected. Please try again in a moment."
    );
  }
}

async function handleMoreSongs() {
  const profile = getProfile();
  const mood = moodProfiles[recommendationState.moodKey];
  const languageConfig = getLanguageConfig(profile.language);
  const genreHints = getGenreHints(profile.genre);
  const recommendationCount =
    recommendationState.lastCount || getRecommendationCount(recommendationState.message);

  recommendationState.offset += recommendationCount;
  const searchTerms = [
    recommendationState.songQuery,
    buildDetailedQuery(recommendationState.message, profile, languageConfig),
    languageConfig.hint && genreHints.primary ? `${languageConfig.hint} ${genreHints.primary}` : "",
    languageConfig.hint,
    genreHints.primary,
    ...genreHints.related,
    ...mood.searchTerms,
  ].filter(Boolean);

  showLoadingMessage("Finding your vibe... fetching more Apple Music songs.");

  try {
    const tracks = await getRecommendations(searchTerms, languageConfig.country);
    hideLoadingMessage();
    const nextTracks = tracks.slice(
      recommendationState.offset,
      recommendationState.offset + recommendationCount
    );

    if (!nextTracks.length) {
      recommendationState.offset = Math.max(0, recommendationState.offset - recommendationCount);
      appendMessage(
        "assistant",
        "I’ve reached the end of the current Apple Music batch. Try a more detailed mood or a different genre for fresh results."
      );
      return;
    }

    appendMessage(
      "assistant",
      `Here are ${nextTracks.length} more Apple Music songs for the same mood.`,
      nextTracks
    );
  } catch (error) {
    hideLoadingMessage();
    recommendationState.offset = Math.max(0, recommendationState.offset - recommendationCount);
    appendMessage(
      "assistant",
      "I couldn’t fetch more Apple Music songs right now."
    );
  }
}

function detectMood(message) {
  const normalized = normalizeText(message);
  const scores = {};

  Object.keys(moodProfiles).forEach((moodKey) => {
    scores[moodKey] = 0;
  });

  for (const [moodKey, mood] of Object.entries(moodProfiles)) {
    mood.aliases.forEach((alias) => {
      if (normalized.includes(normalizeText(alias))) {
        scores[moodKey] += 3;
      }
    });
  }

  for (const [moodKey, signalGroup] of Object.entries(moodSignals)) {
    signalGroup.phrases.forEach((phrase) => {
      if (normalized.includes(normalizeText(phrase))) {
        scores[moodKey] += 4;
      }
    });

    signalGroup.words.forEach((word) => {
      const pattern = new RegExp(`\\b${escapeRegExp(normalizeText(word))}\\b`, "g");
      const matches = normalized.match(pattern);
      if (matches) {
        scores[moodKey] += matches.length * 2;
      }
    });
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] === 0) {
    return "";
  }

  return ranked[0][0];
}

function isGreetingMessage(message) {
  const normalized = normalizeText(message);
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hii",
    "heyy",
    "good morning",
    "good afternoon",
    "good evening",
  ];

  return greetings.includes(normalized);
}

function buildGreetingReply(profile) {
  const namePart = profile.name ? ` ${profile.name}` : "";
  return `Hello${namePart}. Tell me your mood, your favorite type of song, or even a song name, and I’ll find something for you.`;
}

function extractSongIntent(message) {
  const normalized = message.trim();
  const lowered = normalizeText(message);
  const triggerPatterns = [
    /songs?\s+like\s+(.+)/i,
    /recommend\s+.*like\s+(.+)/i,
    /play\s+(.+)/i,
    /listen\s+to\s+(.+)/i,
    /similar\s+to\s+(.+)/i,
  ];

  for (const pattern of triggerPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return cleanSongQuery(match[1]);
    }
  }

  const fillerWords = [
    "i",
    "want",
    "need",
    "give",
    "me",
    "some",
    "song",
    "songs",
    "recommend",
    "music",
    "playlist",
    "play",
    "please",
    "any",
  ];

  const tokens = lowered.split(" ").filter(Boolean);
  const meaningfulTokens = tokens.filter((token) => !fillerWords.includes(token));
  if (meaningfulTokens.length >= 2 && !detectExplicitMoodOnly(lowered)) {
    return cleanSongQuery(meaningfulTokens.join(" "));
  }

  return "";
}

function cleanSongQuery(value) {
  return value.replace(/[?.!,]+$/g, "").trim();
}

function detectExplicitMoodOnly(normalized) {
  return Object.values(moodSignals).some((signalGroup) =>
    signalGroup.phrases.some((phrase) => normalized.includes(normalizeText(phrase)))
  );
}

function inferMoodFromSongIntent(songIntent) {
  if (!songIntent) {
    return "";
  }

  const query = normalizeText(songIntent);
  if (/(dil|love|ishq|pyaar|romance|romantic|jaan|saath|pal pal)/.test(query)) {
    return "romantic";
  }
  if (/(sad|cry|broken|judai|lonely|pain|heart)/.test(query)) {
    return "heartbroken";
  }
  if (/(dance|party|power|run|energy|gym|beat)/.test(query)) {
    return "energetic";
  }
  if (/(calm|peace|soft|night|slow|soul)/.test(query)) {
    return "calm";
  }
  if (/(study|focus|work|lofi|instrumental)/.test(query)) {
    return "focused";
  }

  return "romantic";
}

function buildMoodLeadLine(moodKey, songIntent) {
  const songPart = songIntent ? ` I also picked up "${songIntent}" in your request.` : "";

  const lines = {
    happy: `Looks like you're in a happy mood.${songPart} Let me find songs that match that vibe...`,
    calm: `Looks like you want to relax.${songPart} Let me find songs that match that vibe...`,
    heartbroken: `Looks sad...${songPart} Let me find songs that match that vibe...`,
    focused: `Looks like you want to focus.${songPart} Let me find songs that match that vibe...`,
    energetic: `Looks like you need some energy.${songPart} Let me find songs that match that vibe...`,
    romantic: `Looks like you're in love.${songPart} Let me find songs that match that vibe...`,
  };

  return lines[moodKey] || `Let me find songs for your vibe...`;
}

function applyMoodTheme(moodKey) {
  document.body.dataset.mood = moodKey || "";
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRecommendationIntro(moodKey, profile) {
  const mood = moodProfiles[moodKey];
  const namePart = profile.name ? `${profile.name}, ` : "";
  const languagePart = profile.language ? ` I kept the picks closer to ${profile.language} songs.` : "";
  const genreHints = getGenreHints(profile.genre);
  const genrePart = genreHints.primary ? ` Your ${genreHints.primary} preference helped steer the blend.` : "";

  return `${namePart}${mood.responseLead}${languagePart}${genrePart}`;
}

function getLanguageConfig(language) {
  return languageConfigs[language] || { country: "US", hint: "" };
}

function buildDetailedQuery(message, profile, languageConfig) {
  const cleanedMessage = normalizeText(message);
  const genreHints = getGenreHints(profile.genre);

  return [cleanedMessage, languageConfig.hint, genreHints.primary].filter(Boolean).join(" ");
}

function getGenreHints(genreValue) {
  const normalized = normalizeText(genreValue || "");
  if (!normalized) {
    return { primary: "", related: [] };
  }

  const compact = normalized.replace(/\s+/g, "");
  const mapped = genreIntentMap[compact] || genreIntentMap[normalized];

  if (mapped) {
    return {
      primary: mapped[0],
      related: mapped.slice(1),
    };
  }

  return {
    primary: normalized,
    related: [],
  };
}

function getRecommendationCount(message) {
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount >= 18) {
    return 12;
  }

  if (wordCount >= 10) {
    return 8;
  }

  return 5;
}

async function getRecommendations(searchTerms, country = "US") {
  const resultGroups = await Promise.all(
    searchTerms.slice(0, 4).map((term) =>
      searchITunes({
        term,
        limit: 12,
        country,
      })
    )
  );

  const seen = new Set();
  const flattened = resultGroups
    .flat()
    .filter((track) => track.wrapperType === "track" && track.kind === "song")
    .filter((track) => {
      const key = `${track.trackName}-${track.artistName}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  return flattened;
}

function searchITunes({ term, limit = 10, country = "US" }) {
  const callbackName = `vibeTuneCallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    country,
    limit: String(limit),
    callback: callbackName,
  });

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out"));
    }, 8000);

    window[callbackName] = (response) => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(response.results || []);
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      cleanup();
      reject(new Error("Script load failed"));
    };

    script.src = `https://itunes.apple.com/search?${params.toString()}`;
    document.body.appendChild(script);
  });
}

function buildAppleMusicSearchUrl(trackName, artistName, country = "us") {
  const query = encodeURIComponent(`${trackName} ${artistName}`);
  return `https://music.apple.com/${country.toLowerCase()}/search?term=${query}`;
}

function appendMessage(role, text, recommendations = []) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  article.innerHTML = `
    <div class="message-header">
      <span class="message-role">${role === "assistant" ? "VibeTune AI" : "You"}</span>
      <span class="message-time">${timeLabel}</span>
    </div>
    <p>${escapeHtml(text)}</p>
  `;

  if (recommendations.length) {
    const list = document.createElement("div");
    list.className = "recommendations";

    recommendations.forEach((track) => {
      const trackId = `${track.trackName}-${track.artistName}`;
      const fallbackUrl = buildAppleMusicSearchUrl(track.trackName, track.artistName, track.country || "us");
      const card = document.createElement("section");
      card.className = "recommendation-card";
      card.innerHTML = `
        <div>
          <h3>${escapeHtml(track.trackName)}</h3>
          <p>${escapeHtml(track.artistName)}</p>
          <p class="recommendation-meta">${escapeHtml(track.collectionName || "Single")}</p>
          <div class="recommendation-actions">
            <a class="track-link" href="${fallbackUrl}" target="_blank" rel="noreferrer">Open on Apple Music</a>
            <button class="track-link save-favorite-btn" type="button" data-track-id="${escapeHtml(trackId)}">Save</button>
          </div>
        </div>
      `;

      const saveButton = card.querySelector(".save-favorite-btn");
      saveButton.addEventListener("click", () => {
        saveFavorite(track);
      });

      list.appendChild(card);
    });

    article.appendChild(list);
  }

  messageStack.appendChild(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function showLoadingMessage(text) {
  hideLoadingMessage();

  const article = document.createElement("article");
  article.className = "message assistant loading-message";
  article.innerHTML = `
    <div class="message-header">
      <span class="message-role">VibeTune AI</span>
      <span class="message-time">Now</span>
    </div>
    <div class="loading-row">
      <span class="typing-indicator" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <p>${escapeHtml(text || "Finding your vibe...")}</p>
    </div>
  `;

  messageStack.appendChild(article);
  loadingMessageElement = article;
  chatLog.scrollTop = chatLog.scrollHeight;
}

function hideLoadingMessage() {
  if (!loadingMessageElement) {
    return;
  }

  loadingMessageElement.remove();
  loadingMessageElement = null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function saveFavorite(track) {
  const favorites = getFavorites();
  const exists = favorites.some(
    (item) => item.trackName === track.trackName && item.artistName === track.artistName
  );

  if (exists) {
    appendMessage("assistant", `"${track.trackName}" is already in your favorites.`);
    return;
  }

  favorites.unshift({
    trackName: track.trackName,
    artistName: track.artistName,
    collectionName: track.collectionName || "Single",
    trackViewUrl: buildAppleMusicSearchUrl(track.trackName, track.artistName, track.country || "us"),
  });

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 12)));
  renderFavorites();
  appendMessage("assistant", `Saved "${track.trackName}" to your favorites.`);
}

function renderFavorites() {
  const favorites = getFavorites();

  if (!favorites.length) {
    favoritesList.innerHTML = `<p class="favorites-empty">No favorites yet. Save songs you like...</p>`;
    return;
  }

  favoritesList.innerHTML = "";

  favorites.forEach((track) => {
    const item = document.createElement("article");
    item.className = "favorite-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(track.trackName)}</h3>
        <p>${escapeHtml(track.artistName)}</p>
      </div>
      <div class="favorite-actions">
        <a class="track-link" href="${track.trackViewUrl}" target="_blank" rel="noreferrer">Open</a>
        <button class="track-link remove-favorite-btn" type="button">Remove</button>
      </div>
    `;

    const removeButton = item.querySelector(".remove-favorite-btn");
    removeButton.addEventListener("click", () => {
      removeFavorite(track);
    });

    favoritesList.appendChild(item);
  });
}

function removeFavorite(track) {
  const favorites = getFavorites().filter(
    (item) => !(item.trackName === track.trackName && item.artistName === track.artistName)
  );

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  renderFavorites();
  appendMessage("assistant", `Removed "${track.trackName}" from your favorites.`);
}
