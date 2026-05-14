const coverEl = document.getElementById("cover");
const songNameEl = document.getElementById("song-name");
const artistNameEl = document.getElementById("artist-name");
const paletteEl = document.getElementById("palette");
const lyricsEl = document.getElementById("lyrics");
const progressFillEl = document.getElementById("progress-fill");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const audioEl = document.getElementById("audio");

const customSelectButton = document.getElementById("custom-select-button");
const customSelectList = document.getElementById("custom-select-list");
const customSelectItems = document.querySelectorAll(".custom-select-item");

let currentSong = "JUICY";

let song = null;
let timedWords = [];

let isPlaying = false;
let pausedTime = 0;

let animationId = null;

let songLength = 0;

function parseBeatId(beatId) {

    const parts = String(beatId).split(".");

    const mainBeat = Number(parts[0]);

    const subBeat = parts[1]
        ? Number(parts[1])
        : 0;

    return mainBeat + subBeat / 4;
}

function beatToSeconds(
    beatId,
    bpm,
    offsetSeconds
) {

    const beat = parseBeatId(beatId);

    return offsetSeconds + beat * (60 / bpm);
}

function prepareWords(songData) {

    return songData.words.map((item, index) => {

        return {
            word: item.word,

            time: beatToSeconds(
                item.beat_id,
                songData.bpm,
                songData.offset_seconds || 0
            ),

            index
        };
    });
}

function applyTheme(colors) {

    const primary = colors.primary || "#ff0088";

    const secondary = colors.secondary || "#090909";

    const accent = colors.accent || "#ff73d3";

    document.documentElement.style.setProperty(
        "--primary-color",
        primary
    );

    document.documentElement.style.setProperty(
        "--secondary-color",
        secondary
    );

    document.documentElement.style.setProperty(
        "--accent-color",
        accent
    );

    document.documentElement.style.setProperty(
        "--primary-glow",
        `${primary}88`
    );

    document.body.style.background = "#090909";
}

function renderPalette(colors) {

    paletteEl.innerHTML = "";

    Object.values(colors).forEach(color => {

        const div = document.createElement("div");

        div.className = "color-block";

        div.style.background = color;

        paletteEl.appendChild(div);
    });
}

function renderLyrics(currentTime) {

    lyricsEl.innerHTML = "";

    timedWords.forEach((item, index) => {

        const nextWord = timedWords[index + 1];

        const nextTime =
            nextWord
                ? nextWord.time
                : songLength;

        const span = document.createElement("span");

        span.className = "word";

        span.textContent = item.word;

        if (
            currentTime >= item.time &&
            currentTime < nextTime
        ) {

            span.classList.add("active");
        }

        else if (currentTime >= nextTime) {

            span.classList.add("passed");
        }

        lyricsEl.appendChild(span);
    });
}

function getCurrentTime() {

    return audioEl.currentTime || pausedTime;
}

function updateProgress(currentTime) {

    const percent = Math.min(
        (currentTime / songLength) * 100,
        100
    );

    progressFillEl.style.width = `${percent}%`;
}

function animate() {

    const currentTime = getCurrentTime();

    renderLyrics(currentTime);

    updateProgress(currentTime);

    if (currentTime >= songLength) {

        isPlaying = false;

        startBtn.textContent = "Replay";

        cancelAnimationFrame(animationId);

        return;
    }

    animationId =
        requestAnimationFrame(animate);
}

async function loadSong() {

    cancelAnimationFrame(animationId);

    isPlaying = false;

    pausedTime = 0;

    startBtn.textContent = "Start";

    progressFillEl.style.width = "0%";

    lyricsEl.innerHTML = "Loading...";

    const response =
        await fetch(`data/${currentSong}.json`);

    song = await response.json();

    songNameEl.textContent =
        song.data.orig_name;

    artistNameEl.textContent =
        song.data.orig_artist;

    coverEl.src =
        `data:image/jpeg;base64,${song.theme.image_base64}`;

    renderPalette(song.theme.color_pallete);

    applyTheme(song.theme.color_pallete);

    timedWords = prepareWords(song);

    songLength =
        song.length ||
        timedWords[timedWords.length - 1].time + 5;

    audioEl.src =
        `audio/${currentSong}.mp3`;

    audioEl.load();

    audioEl.pause();

    audioEl.currentTime = 0;

    renderLyrics(0);

    updateProgress(0);
}

startBtn.addEventListener("click", async () => {

    if (!song) return;

    if (!isPlaying) {

        isPlaying = true;

        audioEl.currentTime = pausedTime;

        startBtn.textContent = "Pause";

        try {

            await audioEl.play();

        }

        catch (error) {

            console.log(
                "Audio play error:",
                error
            );
        }

        animate();
    }

    else {

        pausedTime = getCurrentTime();

        isPlaying = false;

        audioEl.pause();

        startBtn.textContent = "Continue";

        cancelAnimationFrame(animationId);
    }
});

resetBtn.addEventListener("click", () => {

    pausedTime = 0;

    isPlaying = false;

    audioEl.pause();

    audioEl.currentTime = 0;

    startBtn.textContent = "Start";

    cancelAnimationFrame(animationId);

    renderLyrics(0);

    updateProgress(0);
});

customSelectButton.addEventListener("click", () => {

    customSelectList.classList.toggle("open");
});

customSelectItems.forEach(item => {

    item.addEventListener("click", async () => {

        currentSong = item.dataset.value;

        customSelectButton.textContent =
            item.textContent.trim();

        customSelectList.classList.remove("open");

        await loadSong();
    });
});

document.addEventListener("click", (event) => {

    if (
        !customSelectButton.contains(event.target) &&
        !customSelectList.contains(event.target)
    ) {

        customSelectList.classList.remove("open");
    }
});

loadSong();