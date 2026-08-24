// ─── State ───
const state = {
    currentQuestionIndex: 0,
    selectedQuestions: [],
    scores: {},
    currentResult: null,
    totalTropePoints: 0,
    realityIntegrity: 100,
    questionTransitioning: false,
    advanceTimer: null,
    preloadImage: null,
    sceneAssignments: [],
    sceneRequestId: 0,
    screen: 'landing',
    resultCategoryId: null,
    analysisSeed: 0
};

// ─── DOM refs ───
const dom = {
    appRoot: document.getElementById('appRoot'),
    appStatus: document.getElementById('appStatus'),
    backgroundLayer: document.getElementById('backgroundLayer'),
    chromeScene: document.getElementById('chromeScene'),
    coefficientBody: document.getElementById('coefficientBody'),
    colliderLegend: document.getElementById('colliderLegend'),
    collisionPlot: document.getElementById('collisionPlot'),
    dashboardId: document.getElementById('dashboardId'),
    finalReality: document.getElementById('finalReality'),
    genrePredictorBars: document.getElementById('genrePredictorBars'),
    landingScreen: document.getElementById('landingScreen'),
    landingSceneStatus: document.getElementById('landingSceneStatus'),
    landingSignal: document.getElementById('landingSignal'),
    linkStatus: document.getElementById('linkStatus'),
    metricStrip: document.getElementById('metricStrip'),
    optionButtons: [...document.querySelectorAll('[data-answer]')],
    playAgainButton: document.getElementById('playAgainButton'),
    posteriorList: document.getElementById('posteriorList'),
    progressText: document.getElementById('progressText'),
    progressTimeline: document.getElementById('progressTimeline'),
    predictorSummary: document.getElementById('predictorSummary'),
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    quizStatus: document.getElementById('quizStatus'),
    quizScreen: document.getElementById('quizScreen'),
    realityMeterFill: document.getElementById('realityMeterFill'),
    realityValue: document.getElementById('realityValue'),
    realityWarning: document.getElementById('realityWarning'),
    resultCategory: document.getElementById('resultCategory'),
    resultHeading: document.getElementById('resultHeading'),
    resultScreen: document.getElementById('resultScreen'),
    resultStory: document.getElementById('resultStory'),
    resultText: document.getElementById('resultText'),
    regressionPlot: document.getElementById('regressionPlot'),
    resultsDashboard: document.getElementById('resultsDashboard'),
    recalibrateButton: document.getElementById('recalibrateButton'),
    shareButton: document.getElementById('shareButton'),
    sceneCaption: document.getElementById('sceneCaption'),
    sceneChannel: document.getElementById('sceneChannel'),
    sceneReadout: document.getElementById('sceneReadout'),
    signalScene: document.getElementById('signalScene'),
    startButton: document.getElementById('startButton'),
    storyContent: document.getElementById('storyContent'),
    storyGenre: document.getElementById('storyGenre'),
    storyPage: document.getElementById('storyPage'),
    timelineNotches: document.getElementById('timelineNotches'),
    timelinePlayhead: document.getElementById('timelinePlayhead'),
    timelineProgress: document.getElementById('timelineProgress'),
    winnerGenre: document.getElementById('winnerGenre'),
    winnerScore: document.getElementById('winnerScore')
};

// Terminal traffic for the decorative background layer.
const scriptSnippets = [
    "CHANNEL OPEN",
    "NO CARRIER",
    "BASEMENT NODE 02",
    "SIGNAL DEGRADED",
    "SUBJECT LINK ACTIVE",
    "PACKET LOSS 03%",
    "MEMORY CHECK: 640K",
    "PORT 02 LISTENING",
    "NARRATIVE TRACE FOUND",
    "FRAME SYNC LOST",
    "RETRYING HANDSHAKE",
    "UNKNOWN SIGNAL",
    "QUERY BUFFER READY",
    "REALITY INDEX NOMINAL",
    "INTERFERENCE DETECTED",
    "REMOTE HOST SILENT",
    "EVIDENCE BUFFER 02",
    "CASE FILE OPEN",
    "SCENE CLOCK ACTIVE",
    "READ ERROR",
    "FALLBACK CHANNEL READY",
    "ENGINE BUILD 2.7.4",
    "SUBJECT RESPONSE PENDING",
    "TRANSMISSION INCOMPLETE"
];

// Monochrome category signals for terminal bars: everything is signal-green except
// Reality, which gets the phosphor highlight. (Yes, this used to be a 14-key object
// literal. It has been sent to live on a farm.)
const categoryBarColors = new Proxy(
    { [14]: 'var(--ds-phosphor)' },
    { get: (target, key) => target[key] ?? 'var(--ds-signal)' }
);

// Short names for the prediction bars
const categoryShortNames = {
    1: 'Fantasy',
    2: 'Dystopian',
    3: 'Anime',
    4: 'Slice of Life',
    5: 'Superhero',
    6: 'Sitcom',
    7: 'Horror',
    8: 'Mystery',
    9: 'Rom-Com',
    10: 'Tarantino',
    11: 'Spielberg',
    12: 'Space Opera',
    13: 'Mafia Epic',
    14: 'Reality'
};

// Category background tints for the decorative layer behind the terminal.
// Literal values, named after what they actually look like this time.
const categoryThemes = {
    1: { bg: 'linear-gradient(135deg, #122d22 0%, #e0a34b 100%)', name: 'fantasy' },            // ember amber
    2: { bg: 'linear-gradient(135deg, #091a14 0%, #2f6653 100%)', name: 'dystopian' },          // concrete green-gray
    3: { bg: 'linear-gradient(135deg, #3d1d22 0%, #d5dc73 100%)', name: 'anime' },              // hot coral into phosphor
    4: { bg: 'linear-gradient(135deg, #0d241c 0%, #73f0bb 100%)', name: 'slice-of-life' },      // quiet morning teal
    5: { bg: 'linear-gradient(135deg, #3d1d22 0%, #34c998 100%)', name: 'superhero' },          // alarm red into signal
    6: { bg: 'linear-gradient(135deg, #2f2a12 0%, #d5dc73 100%)', name: 'sitcom' },             // studio-audience gold
    7: { bg: 'linear-gradient(135deg, #000704 0%, #3d1d22 100%)', name: 'horror' },             // actual darkness, duh
    8: { bg: 'linear-gradient(135deg, #0d241c 0%, #7c9d8c 100%)', name: 'mystery' },            // rain-slick slate
    9: { bg: 'linear-gradient(135deg, #2f2a12 0%, #e0a34b 100%)', name: 'romance' },            // golden-hour amber
    10: { bg: 'linear-gradient(135deg, #1c1409 0%, #e0a34b 100%)', name: 'tarantino' },         // sepia diner
    11: { bg: 'linear-gradient(135deg, #091a14 0%, #73f0bb 100%)', name: 'spielberg' },         // magic-hour sky
    12: { bg: 'linear-gradient(135deg, #000704 0%, #091a14 100%)', name: 'space-opera' },       // the void
    13: { bg: 'linear-gradient(135deg, #0d241c 0%, #06100d 100%)', name: 'mafia' },             // back-room shadows
    14: { bg: 'linear-gradient(135deg, #183b2e 0%, #7c9d8c 100%)', name: 'reality' }            // flat office gray-green
};

// Initialize static script text
function initBackground() {
    dom.backgroundLayer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const scriptEl = document.createElement('div');
        scriptEl.className = 'script-text';
        scriptEl.textContent = MODEL.scriptSnippets[Math.floor(Math.random() * MODEL.scriptSnippets.length)];
        scriptEl.style.left = Math.random() * 95 + '%';
        scriptEl.style.top = Math.random() * 95 + '%';
        dom.backgroundLayer.appendChild(scriptEl);
    }
}

// Change background based on category
function updateBackgroundTheme(categoryId) {
    const theme = MODEL.categoryThemes[categoryId];
    if (theme) {
        dom.backgroundLayer.style.background = theme.bg;
    }
}

// Initialize timeline notches
function initTimeline() {
    dom.timelineNotches.innerHTML = '';
    for (let i = 0; i < state.selectedQuestions.length; i++) {
        const notch = document.createElement('div');
        notch.className = 'timeline-notch';
        dom.timelineNotches.appendChild(notch);
    }
}

// Update reality integrity
function updateRealityIntegrity() {
    const wasCritical = state.realityIntegrity < 50;
    state.realityIntegrity = calculateRealityIntegrity(state.totalTropePoints);
    dom.realityValue.textContent = state.realityIntegrity + '%';
    dom.realityMeterFill.style.width = state.realityIntegrity + '%';

    if (state.realityIntegrity < 50) {
        dom.realityValue.classList.add('critical');
        dom.realityWarning.textContent = 'Status: Narrative interference detected';
        dom.realityWarning.classList.add('active');
        if (!wasCritical) setQuizStatus('Critical reality state. Narrative interference detected.');
    } else {
        dom.realityValue.classList.remove('critical');
        dom.realityWarning.textContent = 'Status: Nominal';
        dom.realityWarning.classList.remove('active');
    }
    syncDomContract();
}

// Animate waveform
function isReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showWaveform() {
    if (isReducedMotion()) return;
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach(bar => {
        const height = Math.random() * 20 + 10;
        bar.style.height = height + 'px';
    });
}

function spikeWaveform() {
    if (isReducedMotion()) return;
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach(bar => {
        bar.style.height = (Math.random() * 25 + 15) + 'px';
    });
    setTimeout(() => {
        bars.forEach(bar => {
            bar.style.height = '10px';
        });
    }, 500);
}

// Categories Database
const categories = {
    1: {
        name: "Destiny / Fantasy Hero",
        result: "You are the Chosen One. Stop ignoring the old man in the tavern; he has a quest for you. Also, check your attic for legendary swords.",
        scene: "assets/dead-signal/fantasy.webp",
        sceneAlt: "A lone traveler enters a candlelit tavern while patrons mutter.",
        sceneVariants: [
            { src: "assets/dead-signal/fantasy-02.webp", alt: "A lone adventurer crosses a moonlit forest bridge toward a ruined castle." },
            { src: "assets/dead-signal/fantasy-03.webp", alt: "An apprentice approaches a hovering crystal inside a ruined mountain observatory." }
        ],
        sceneKey: "fantasy"
    },
    2: {
        name: "Young Adult Dystopian Hero",
        result: "You are the protagonist of a YA Dystopian novel. You're likely wearing combat boots and are about to overthrow a government using only angst and a bow and arrow.",
        scene: "assets/dead-signal/dystopian.webp",
        sceneAlt: "A teenager stands at a guarded city wall facing an impossible landscape.",
        sceneVariants: [
            { src: "assets/dead-signal/dystopian-02.webp", alt: "Citizens wait inside an underground ration depot under surveillance." },
            { src: "assets/dead-signal/dystopian-03.webp", alt: "A lone pedestrian crosses a rain-soaked megacity walkway beneath a scanning drone." }
        ],
        sceneKey: "dystopian"
    },
    3: {
        name: "Anime / Manga Protagonist",
        result: "You are a Shonen Protagonist. Your power level is rising. If you start glowing or screaming for more than 30 seconds, please move to an open field to avoid property damage.",
        scene: "assets/dead-signal/anime.webp",
        sceneAlt: "A student on a rooftop confronts a glowing transformation device.",
        sceneVariants: [
            { src: "assets/dead-signal/anime-02.webp", alt: "A young hero stages a rescue in an underground train bay as a radio signal glows." },
            { src: "assets/dead-signal/anime-03.webp", alt: "A lone radio operator stands inside a lighthouse lantern room." }
        ],
        sceneKey: "anime"
    },
    4: {
        name: "Main Character Energy (Slice of Life)",
        result: "You have Main Character Energy. Your life is a slow-burn indie film where small moments feel profound. Enjoy the aesthetic melancholy.",
        scene: "assets/dead-signal/slice-of-life.webp",
        sceneAlt: "Two people share a small everyday moment in a quiet morning corridor.",
        sceneVariants: [
            { src: "assets/dead-signal/slice-of-life-02.webp", alt: "Two people share breakfast in an ordinary apartment kitchen." },
            { src: "assets/dead-signal/slice-of-life-03.webp", alt: "Two neighbors repair a bicycle beside a rainy bus shelter." }
        ],
        sceneKey: "slice-of-life"
    },
    5: {
        name: "Superhero / Comic Book Lead",
        result: "You are a Superhero. Your double life is exhausting, your costume is impractical, and your loved ones are in constant danger. But at least you look cool.",
        scene: "assets/dead-signal/superhero.webp",
        sceneAlt: "An ordinary person discovers a restrained glowing power in a rainy alley.",
        sceneVariants: [
            { src: "assets/dead-signal/superhero-02.webp", alt: "A masked vigilante stands on a water tower as a green energy arc crosses the city at dawn." },
            { src: "assets/dead-signal/superhero-03.webp", alt: "An airborne hero projects a glowing shield over a collapsing suspension bridge." }
        ],
        sceneKey: "superhero"
    },
    6: {
        name: "Sitcom Character",
        result: "You are a Sitcom Character. Your problems are easily solved in 22 minutes, your apartment is inexplicably nice, and laugh tracks follow you everywhere.",
        scene: "assets/dead-signal/sitcom.webp",
        sceneAlt: "An awkward ensemble gathers in a cramped apartment living room.",
        sceneVariants: [
            { src: "assets/dead-signal/sitcom-02.webp", alt: "Four roommates and a dog cause a slapstick breakfast disaster in a tiny kitchen." },
            { src: "assets/dead-signal/sitcom-03.webp", alt: "Four adults and a dog scramble through a rooftop barbecue mishap." }
        ],
        sceneKey: "sitcom"
    },
    7: {
        name: "Horror Movie Survivor (or Victim)",
        result: "You are in a Horror Movie. Stop investigating strange noises. Stop going into basements. Just leave. Now. While you still can.",
        scene: "assets/dead-signal/horror.webp",
        sceneAlt: "A lone figure descends into a dark basement after an unknown signal.",
        sceneVariants: [
            { src: "assets/dead-signal/horror-02.webp", alt: "A flashlight illuminates a locked hatch inside a lighthouse lantern room while a silhouette waits outside." },
            { src: "assets/dead-signal/horror-03.webp", alt: "A lone silhouette sits inside an abandoned movie theater beneath a blank screen." }
        ],
        sceneKey: "horror"
    },
    8: {
        name: "Mystery / Detective Protagonist",
        result: "You are a Detective. You see clues where others see trash. You probably look great in a trench coat, but your personal life is likely a shambles.",
        scene: "assets/dead-signal/mystery.webp",
        sceneAlt: "An investigator studies an evidence board and a strange key at a rain-soaked desk.",
        sceneVariants: [
            { src: "assets/dead-signal/mystery-02.webp", alt: "A locked suitcase, brass key and wet glove wait on a rainy railway platform." },
            { src: "assets/dead-signal/mystery-03.webp", alt: "Muddy footprints cross a midnight observatory toward a hidden trapdoor." }
        ],
        sceneKey: "mystery"
    },
    9: {
        name: "Romantic Comedy Lead",
        result: "You are in a Rom-Com. That clumsiness is charming, not dangerous. Prepare for a misunderstanding at the 60-minute mark, followed by a sprint through an airport.",
        scene: "assets/dead-signal/romance.webp",
        sceneAlt: "Two mutually interested adults meet across a rainy train platform.",
        sceneVariants: [
            { src: "assets/dead-signal/romance-02.webp", alt: "Two adults reunite in a quiet apartment kitchen before dawn." },
            { src: "assets/dead-signal/romance-03.webp", alt: "A couple shares a scarf inside a rooftop greenhouse at night." }
        ],
        sceneKey: "romance"
    },
    10: {
        name: "Tarantino Universe Character",
        result: "You are in a Tarantino movie. Your life is cool, violent, and non-linear. Enjoy the witty dialogue, but watch out—statistically, you might not make it to the credits.",
        scene: "assets/dead-signal/crime-dialogue.webp",
        sceneAlt: "Two sharply dressed figures face a mysterious glowing briefcase in a roadside diner.",
        sceneVariants: [
            { src: "assets/dead-signal/crime-dialogue-02.webp", alt: "A detective questions an informant beside a cassette recorder in a police interview room." },
            { src: "assets/dead-signal/crime-dialogue-03.webp", alt: "Two figures exchange evidence inside a dim cinema projection booth." }
        ],
        sceneKey: "crime-dialogue"
    },
    11: {
        name: "Spielberg Adventure Hero",
        result: "You are in a Spielberg Adventure. Look at the horizon with awe. Something magical is coming, and it's going to make grown men cry.",
        scene: "assets/dead-signal/suburban-adventure.webp",
        sceneAlt: "Children with bicycles discover a strange light at the edge of foggy woods.",
        sceneVariants: [
            { src: "assets/dead-signal/suburban-adventure-02.webp", alt: "Muddy footprints lead from a red wagon toward a storm drain in a rainy cul-de-sac." },
            { src: "assets/dead-signal/suburban-adventure-03.webp", alt: "A flashlight beam reveals a trapdoor inside a backyard treehouse clubhouse." }
        ],
        sceneKey: "suburban-adventure"
    },
    12: {
        name: "Lucas Space Opera Hero",
        result: "You are in a Space Opera Myth. You have a grand destiny, daddy issues, and a high probability of losing a hand. May the Force be with you.",
        scene: "assets/dead-signal/space-opera.webp",
        sceneAlt: "A lone pilot faces an enormous ringed planet from a small spacecraft cockpit.",
        sceneVariants: [
            { src: "assets/dead-signal/space-opera-02.webp", alt: "A shuttle docks at an orbital salvage platform above a ringed planet." },
            { src: "assets/dead-signal/space-opera-03.webp", alt: "A grounded exploration craft faces an ancient glowing gateway in a moon canyon." }
        ],
        sceneKey: "space-opera"
    },
    13: {
        name: "Coppola Family Epic Character",
        result: "You are in a Mafia Family Drama. It's strictly business. Don't go fishing, don't accept favors on your daughter's wedding day, and stay away from the cannoli.",
        scene: "assets/dead-signal/family-crime.webp",
        sceneAlt: "A multigenerational family gathers tensely around a dining table and closed ledger.",
        sceneVariants: [
            { src: "assets/dead-signal/family-crime-02.webp", alt: "Members of a crime family conduct a tense exchange inside a riverside boathouse." },
            { src: "assets/dead-signal/family-crime-03.webp", alt: "A patriarch and two heirs stand around a sealed chest in a stone wine cellar." }
        ],
        sceneKey: "family-crime"
    },
    14: {
        name: "Regular Miserable Person",
        result: "You are an NPC in a Simulation. Or just a person. You have no plot armor, your dialogue is unscripted and awkward, and your 'character arc' is just you trying to pay off a credit card. Go drink some water.",
        scene: "assets/dead-signal/reality.webp",
        sceneAlt: "A tired person holds a mismatched plastic container lid in a dim ordinary kitchen.",
        sceneVariants: [
            { src: "assets/dead-signal/reality-02.webp", alt: "A tired person waits alone for laundry in an ordinary laundromat." },
            { src: "assets/dead-signal/reality-03.webp", alt: "A weary shopper waits at an ordinary supermarket checkout." }
        ],
        sceneKey: "reality"
    }
};

// Questions Database
const questions = [
    // Category 1: Destiny / Fantasy Hero
    { text: "Does anyone around you keep muttering something when you enter a room?", categoryId: 1 },
    { text: "Have you recently discovered you can read an ancient language despite never studying it?", categoryId: 1 },
    { text: "Did a talking animal, tree, or sword give you life advice in the last 48 hours?", categoryId: 1 },
    { text: "Is there a local cult whose members seems oddly focused on you?", categoryId: 1 },
    { text: "Have you learned that an object you've had since childhood is actually 'the object'?", categoryId: 1 },
    { text: "Do elderly people stare at you, whisper, and then refuse to explain what they know?", categoryId: 1 },
    { text: "Has a mentor figure died immediately after giving you one really important speech?", categoryId: 1 },
    { text: "Are you inexplicably good at swordfighting / archery despite zero training?", categoryId: 1 },
    { text: "Has anyone told you that 'your power is unstable'?", categoryId: 1 },

    // Category 2: Young Adult Dystopian Hero
    { text: "Are you forced to wear the same gray or beige outfit every day?", categoryId: 2 },
    { text: "Is your love interest on the opposite side of the regime, yet weirdly bad at arresting you?", categoryId: 2 },
    { text: "Have you discovered that the 'outside world' is not what everyone claims it is?", categoryId: 2 },

    // Category 3: Anime / Manga Protagonist
    { text: "Do strangers frequently comment on your 'incredible potential' despite overwhelming evidence to the contrary?", categoryId: 3 },
    { text: "Did your tragic childhood only get mentioned halfway through conversations?", categoryId: 3 },
    { text: "Does your power level dramatically increase whenever you think about friendship?", categoryId: 3 },
    { text: "Has a mysterious rival appeared whose sole purpose is to glare at you from rooftops?", categoryId: 3 },
    { text: "Do you regularly survive injuries that should require at least three funerals?", categoryId: 3 },
    { text: "Is there a tournament arc in your life where absolutely everything must be decided by a flashy battle?", categoryId: 3 },
    { text: "Do enemies politely wait for you to finish long speeches before attacking?", categoryId: 3 },
    { text: "Have you ever unlocked a new form/state by screaming for an uncomfortably long time?", categoryId: 3 },
    { text: "Did you die and wake up in another world with a menu screen and inventory?", categoryId: 3 },
    { text: "Is there a mascot creature nearby whose main abilities are being adorable and selling merch?", categoryId: 3 },

    // Category 4: Main Character Energy
    { text: "Has anyone ever told you, 'You always learn the lesson right before the credits roll'?", categoryId: 4 },
    { text: "Do you bump into the same three strangers in wildly different parts of town for no reason?", categoryId: 4 },
    { text: "Does your alarm clock ring exactly when something dramatic happens?", categoryId: 4 },
    { text: "Is your local coffee shop staff weirdly invested in your love life?", categoryId: 4 },
    { text: "Does your internal monologue sound like it's narrated by someone with a podcast?", categoryId: 4 },
    { text: "Do heartfelt conversations conveniently happen during sunsets with perfect lighting?", categoryId: 4 },
    { text: "Does every big life event happen on weekends or evenings—never during boring office hours?", categoryId: 4 },
    { text: "When you change your hairstyle, does everyone react like it's a season premiere?", categoryId: 4 },
    { text: "Do you often say 'I have a bad feeling about this' right before something important happens?", categoryId: 4 },
    { text: "Does your life seem to have 'bottle episodes' where everything happens in one location?", categoryId: 4 },

    // Category 5: Superhero / Comic Book Lead
    { text: "Do you have a secret second wardrobe made mostly of spandex, leather, or capes?", categoryId: 5 },
    { text: "Did a freak accident (lab, spider, radiation, alien artifact) give you abilities instead of a lawsuit?", categoryId: 5 },
    { text: "Is your city's crime rate mysteriously correlated with your availability?", categoryId: 5 },
    { text: "Does no one recognize you when you put on a small mask or different glasses?", categoryId: 5 },
    { text: "Is there an arch-nemesis who somehow escapes prison every other week?", categoryId: 5 },
    { text: "Does your boss keep saying 'Where were you during the attack?!' while you're bandaged up?", categoryId: 5 },
    { text: "Have you dramatically whispered 'With great power comes great responsibility' at least once?", categoryId: 5 },
    { text: "Is your romantic relationship constantly ruined by you having to 'step out for a minute'?", categoryId: 5 },

    // Category 6: Sitcom Character
    { text: "Do people around you pause and stare into the distance as if waiting for laughter?", categoryId: 6 },
    { text: "Does every problem in your life escalate absurdly and then reset by next week?", categoryId: 6 },
    { text: "Do you live in an apartment far nicer than your salary can realistically explain?", categoryId: 6 },
    { text: "Is your neighbor/friend always dropping by without knocking, yet no one calls the police?", categoryId: 6 },
    { text: "Do minor misunderstandings spiral into chaos because no one will explain a simple sentence?", categoryId: 6 },
    { text: "Have you pretended to be someone's partner/boss/parent to get out of an awkward situation?", categoryId: 6 },
    { text: "Does your workplace have exactly 5–8 recurring characters and nobody else?", categoryId: 6 },
    { text: "Do your exes or old classmates reappear exactly when the episode needs drama?", categoryId: 6 },

    // Category 7: Horror Movie Survivor
    { text: "Do you currently live near a cemetery, old asylum, or house described as 'having history'?", categoryId: 7 },
    { text: "Have you heard a noise in the basement and thought, 'I should investigate alone, unarmed'?", categoryId: 7 },
    { text: "Does your town have a legend everyone knows but no one takes seriously until it's too late?", categoryId: 7 },
    { text: "Has someone suggested splitting up, and you agreed like that was a good idea?", categoryId: 7 },
    { text: "Do children in your area quietly sing creepy rhymes about local tragedies?", categoryId: 7 },
    { text: "Has a mirror, TV, or doll ever stared back at you in a way that felt… too intentional?", categoryId: 7 },
    { text: "Does the weather dramatically shift to thunder and lightning whenever secrets are revealed?", categoryId: 7 },
    { text: "Did you recently move into a place where the rent is suspiciously cheap?", categoryId: 7 },

    // Category 8: Mystery / Detective
    { text: "Do you routinely notice tiny details that everyone else somehow missed?", categoryId: 8 },
    { text: "Have you ever dramatically announced the solution to a problem in front of a gathered crowd?", categoryId: 8 },
    { text: "Do you get invited to isolated mansions, trains, or islands right before a crime happens?", categoryId: 8 },
    { text: "Has someone said, 'You're the only one who can figure this out' despite many qualified professionals?", categoryId: 8 },
    { text: "Does your friend group include at least one comic-relief sidekick who keeps almost dying?", categoryId: 8 },
    { text: "Do you keep a bulletin board full of photos and red string, and call it 'thinking'?", categoryId: 8 },

    // Category 9: Romantic Comedy Lead
    { text: "Have you literally collided with a stranger while carrying coffee, groceries, or paperwork?", categoryId: 9 },
    { text: "Is there someone you 'can't stand' but also think about constantly for no good reason?", categoryId: 9 },
    { text: "Does terrible weather appear exactly when you need a dramatic confession scene?", categoryId: 9 },
    { text: "Have you had to choose between a stable, kind person and a chaotic, charming disaster?", categoryId: 9 },
    { text: "Do you make big life decisions based on overhearing half a conversation?", categoryId: 9 },
    { text: "Has your best friend ever said, 'The person you're looking for has been right here all along'?", categoryId: 9 },
    { text: "Do grand public gestures of affection keep happening around you—and somehow work out?", categoryId: 9 },

    // Category 10: Tarantino Universe
    { text: "Do you frequently have long, philosophical conversations about trivial topics (like burgers or tipping) right before something violent happens?", categoryId: 10 },
    { text: "Is the soundtrack of your life made of obscure but incredibly cool retro tracks that start playing at oddly tense moments?", categoryId: 10 },
    { text: "Has anyone ever delivered a calm, five-minute speech while clearly holding a weapon?", categoryId: 10 },
    { text: "Do arguments in your world escalate from 'casual banter' to 'life-threatening situation' instantly?", categoryId: 10 },
    { text: "Does your story keep jumping back and forth in time, revealing that actually you already saw this scene… from a different angle?", categoryId: 10 },
    { text: "Have you recently opened a briefcase, seen a mysterious glowing light, and nobody will tell you what it is?", categoryId: 10 },
    { text: "Have you ever danced in a diner, bar, or living room for no clear reason, but it somehow felt extremely important to the plot?", categoryId: 10 },
    { text: "Does everyone talk like they're trying to win a 'Coolest Dialogue' competition?", categoryId: 10 },

    // Category 11: Spielberg Adventure
    { text: "Are you or one of your closest companions a child who knows way more than the adults about what's going on?", categoryId: 11 },
    { text: "Do ordinary suburban streets around you frequently become scenes of extraordinary events (UFOs, dinosaurs)?", categoryId: 11 },
    { text: "Have you recently touched something otherworldly while soft, emotional music played in the background?", categoryId: 11 },
    { text: "Do your most important moments happen at sunset with a suspiciously perfect glowing sky?", categoryId: 11 },
    { text: "Is there a gentle, misunderstood creature/being that everyone fears except you and your small group of friends?", categoryId: 11 },
    { text: "Do bicycles, walkie-talkies, and improvised gadgets play a suspiciously large role in your survival?", categoryId: 11 },
    { text: "Have you looked up into the sky in awe at something huge and mysterious while the camera zooms in on your face?", categoryId: 11 },

    // Category 12: Lucas Space Opera
    { text: "Have you ever learned that the main villain is secretly related to you in a very inconvenient way?", categoryId: 12 },
    { text: "Does your world contain a giant authoritarian empire, a scrappy rebellion, and a moon-sized superweapon?", categoryId: 12 },
    { text: "Did an old, cryptic mentor tell you to 'trust your feelings' instead of giving clear instructions?", categoryId: 12 },
    { text: "Do people around you casually use mystical energy, but insist it's also kind of science?", categoryId: 12 },
    { text: "Is there a noisy alien bar/cantina where everyone seems to be doing illegal business in the open?", categoryId: 12 },
    { text: "Have you piloted, or wanted to pilot, a ridiculously unsafe vehicle through impossible obstacles at high speed?", categoryId: 12 },
    { text: "Do you have a bad feeling about things so often it might as well be your catchphrase?", categoryId: 12 },

    // Category 13: Coppola Family Epic
    { text: "Is your life heavily influenced by a powerful family, clan, or organization where loyalty matters more than the law?", categoryId: 13 },
    { text: "Do major decisions get made around large dining tables, in hushed tones, while everyone pretends nothing is wrong?", categoryId: 13 },
    { text: "Have you ever been told, 'It's not personal, it's strictly business' right before something very personal happened?", categoryId: 13 },
    { text: "Do you find yourself slowly becoming more like a parent or elder you swore you'd never resemble?", categoryId: 13 },
    { text: "Do weddings, baptisms, or other sacred ceremonies in your world suspiciously coincide with acts of extreme betrayal?", categoryId: 13 },
    { text: "Does rain, dim light, or church organs play whenever major moral choices are made?", categoryId: 13 },
    { text: "Are deals in your world always described as 'offers you can't refuse,' yet you really wish you could?", categoryId: 13 },

    // Category 14: Regular Miserable Person (Reality Control)
    { text: "Do you wake up feeling slightly worse than when you went to sleep, despite having no battle injuries?", categoryId: 14 },
    { text: "If a stranger approached you in a tavern/bar with a 'quest,' would you assume they are drunk or trying to sell you crypto?", categoryId: 14 },
    { text: "Is the most 'mysterious object' in your possession a plastic container lid that doesn't match any of your bowls?", categoryId: 14 },
    { text: "Do your conversations often involve saying 'What?' three times, then just awkwardly laughing because you still didn't hear them?", categoryId: 14 },
    { text: "Is your current 'Arch-Nemesis' a printer, a neighbor, or nonspecific lower back pain?", categoryId: 14 },
    { text: "If you fell off a roof, are you 100% certain you would die immediately rather than landing in a convenient dumpster?", categoryId: 14 },
    { text: "Has a 'bottle episode' (stuck in traffic, DMV waiting room) lasted 4 hours with absolutely no character development?", categoryId: 14 },
    { text: "Is the 'soundtrack' of your life mostly just the hum of a refrigerator or mild tinnitus?", categoryId: 14 }
];

// Genre story excerpts
const genreStories = {
    1: {
        genre: "FANTASY EPIC",
        stories: [
            "The ancient prophecy had been clear: a child would be born under the blood moon, marked by destiny and bearing the sign of the Chosen.",
            "The sword felt impossibly light in their hand, as if it had been waiting centuries for this very moment. The runes along its blade began to glow.",
            "\"The prophecy speaks of you,\" the old woman whispered, her eyes milky with age but somehow seeing everything. \"You cannot run from what you are.\"",
            "In the dusty corner of the attic, wrapped in cloth that had not been touched in generations, the artifact pulsed with an otherworldly light."
        ]
    },
    2: {
        genre: "DYSTOPIAN CHRONICLE",
        stories: [
            "The city walls loomed gray and endless. Beyond them, they said, was death. But she had begun to suspect that was a lie.",
            "The uniform was the same as everyone else's—regulation gray, regulation cut. Yet somehow, the Enforcers always seemed to know which face to watch.",
            "\"You're one of us now,\" he said, his rebel insignia barely visible in the dim light. \"There's no going back to who you were.\"",
            "The announcement crackled through every speaker: \"Citizen 4719, report for sorting.\" Her blood ran cold. Today was the day everything would change."
        ]
    },
    3: {
        genre: "SHONEN SAGA",
        stories: [
            "The power surged through their body like lightning. Friends. That's what gave them strength. That's what made them unbeatable.",
            "\"You have potential,\" the master said, though his student had just destroyed the entire training ground. \"Raw, uncontrollable, catastrophic potential.\"",
            "The rival stood atop the building, silhouetted against the moon, his coat billowing dramatically. They locked eyes. This battle had been inevitable.",
            "They fell to their knees, wounds that should have killed them three times over somehow... not mattering. The tournament had to continue. Their friends were watching."
        ]
    },
    4: {
        genre: "INDIE DRAMA",
        stories: [
            "The coffee was getting cold, but the conversation had hit that perfect moment where time didn't seem to matter anymore.",
            "It was Tuesday again. Same walk, same thoughts, same melancholy. But somehow, today, it all felt significant.",
            "The sunset painted the ordinary street in extraordinary colors. They stood there, phone in hand, wondering if this moment was worth photographing or just... feeling.",
            "\"You always do this,\" their friend said with a knowing smile. \"You turn nothing into something profound.\" They weren't wrong."
        ]
    },
    5: {
        genre: "SUPERHERO CHRONICLE",
        stories: [
            "The mask went on. The person disappeared. What remained was something else—something the city needed but would never truly understand.",
            "\"Where were you?\" The question hung in the air, heavy with suspicion. If only they knew that saving the world and making it to dinner on time were mutually exclusive.",
            "The accident should have killed them. Instead, it had given them something impossible. Power. Responsibility. A double life that would cost them everything.",
            "The villain smiled from behind bars. \"See you next week,\" they said. And somehow, terrifyingly, that was always true."
        ]
    },
    6: {
        genre: "SITCOM SCRIPT",
        stories: [
            "The door swung open without a knock. Again. How did they even afford this apartment? And why did problems that should take weeks always resolve themselves by Friday?",
            "The misunderstanding spiraled beautifully out of control. One simple sentence could fix it. But where was the fun in that?",
            "\"Remember when—\" they started, and suddenly the whole gang was there, as if summoned by the power of nostalgia and convenient timing.",
            "The problem was ridiculous. The solution was even more ridiculous. But somehow, it would all work out in exactly 22 minutes."
        ]
    },
    7: {
        genre: "HORROR NOVEL",
        stories: [
            "The house was too cheap. The realtor had been too eager. And now, alone in the darkness, they understood why.",
            "The children's song drifted through the empty street: \"One, two, he's coming for you...\" How did they all know the same rhyme?",
            "\"We should split up,\" someone said. The words hung in the air like a death sentence. And yet, somehow, everyone agreed.",
            "The reflection in the mirror moved a fraction of a second too late. They tried to convince themselves it was their imagination. It wasn't."
        ]
    },
    8: {
        genre: "MYSTERY THRILLER",
        stories: [
            "The clue had been there all along, hidden in plain sight. Everyone else had looked right past it. But they had a gift for seeing what others missed.",
            "The invitation arrived on cream-colored cardstock: \"You are cordially invited to Blackwood Manor.\" Three days later, the first body would be found.",
            "\"You're the only one who can solve this,\" they said, despite a room full of qualified detectives. Perhaps they were right. Perhaps that was the problem.",
            "The red string connected the photos like a spider's web. To anyone else, it looked like madness. To them, it was the only thing that made sense."
        ]
    },
    9: {
        genre: "ROMANTIC COMEDY",
        stories: [
            "The coffee spilled in slow motion, papers flying, eyes meeting in that suspended moment of disaster that somehow felt like fate.",
            "\"I can't stand you,\" they said, thinking about him constantly. The universe had a funny way of making people eat their words.",
            "The rain started right on cue, as if the weather itself was conspiring to create the perfect moment for a confession that would change everything.",
            "\"They were right in front of you this whole time,\" her best friend said with an exasperated smile. \"How could you not see it?\""
        ]
    },
    10: {
        genre: "TARANTINO SCREENPLAY",
        stories: [
            "They talked about nothing—the usual burger philosophy—for fifteen minutes. Then the guns came out. That's how it always went.",
            "The briefcase glowed. Nobody asked what was inside. Smart people in this world learned not to ask questions that might get them killed.",
            "\"You know what they call this in Paris?\" The conversation was casual. The weapon in his lap was not. This was how business got done.",
            "The timeline jumped. Again. What happened yesterday would be shown next Tuesday. What happened ten years ago was happening now. It all made sense if you stopped trying."
        ]
    },
    11: {
        genre: "SPIELBERG ADVENTURE",
        stories: [
            "The child pointed at the sky with absolute certainty. The adults exchanged worried glances. Kids always knew first.",
            "The bicycle flew over the moon—or at least it felt that way. Magic was real, adventure was calling, and suburbia would never be the same.",
            "The creature was gentle, misunderstood, terrifying to everyone except the small group who saw the truth. They would protect it, no matter the cost.",
            "The sunset was impossibly perfect, painting everything gold. Somewhere, a violin swelled. This was the moment that would define everything."
        ]
    },
    12: {
        genre: "SPACE OPERA",
        stories: [
            "\"He is your blood,\" the figure said, and the galaxy suddenly felt impossibly small and personal. Family drama on a cosmic scale.",
            "The mystical energy flowed through them—definitely not magic, absolutely science-based, trust us—as they lifted the starship with their mind.",
            "The cantina was loud, dangerous, and absolutely the kind of place where every conversation could start a war or forge an alliance.",
            "\"Something about this feels wrong,\" they muttered, for the seventeenth time this week. Their instincts were always right. That was the problem."
        ]
    },
    13: {
        genre: "MAFIA DRAMA",
        stories: [
            "The family gathered around the table. Business would be discussed. Loyalty would be tested. And someone would not leave this room.",
            "\"It's not personal,\" he said quietly, \"it's strictly business.\" But they both knew that was a lie. It was always personal.",
            "The rain fell like judgment itself. Church bells echoed in the distance. Moral choices were being made in the shadows, and there were no good options.",
            "\"He'll receive a proposal with exactly one acceptable answer,\" he said, and everyone in the room understood exactly what that meant."
        ]
    },
    14: {
        genre: "REALITY",
        stories: [
            "The alarm went off. Again. She hit snooze. The coffee was lukewarm. There was no dramatic reason for it. Just bad timing and a microwave that beeped too soon.",
            "\"What?\" he said for the third time. His friend repeated the sentence. He still didn't catch it. They both laughed awkwardly and moved on.",
            "The printer jammed. Of course it did. The IT ticket would take three days. This was his arch-nemesis now. Not a villain. Just... this.",
            "He opened the tupperware drawer. Seventeen lids. None of them matched. This was the mystery he was solving today. There would be no resolution."
        ]
    }
};

// Expanded story excerpts for results
const resultStories = {
    1: "The old woman's eyes glowed silver in the tavern's dim light. \"The Marked One,\" she whispered, though he'd told no one his name. Her gnarled finger pointed to the birthmark he'd kept hidden since childhood. \"The prophecy speaks of the one born under the blood moon, bearer of the serpent's mark.\" Outside, thunder rolled across a cloudless sky. The ancient sword hanging above the hearth began to hum, its runes blazing to life after centuries of silence. Every patron turned to stare. He felt it then—the weight of destiny settling onto his shoulders like an iron cloak. The quest had found him at last.",

    2: "The wall was gray. Everything beyond the wall was death, they said. Kira stood at her assigned post, regulation uniform pressed, regulation thoughts carefully maintained. Then she saw it—a crack in the propaganda feed, a single frame of green where there should only be ash. Her handler smiled that careful smile. \"Citizen 4719, you've been selected.\" The words should have filled her with pride. Instead, her chest tightened with a feeling they'd trained out of her years ago: fear. Because she'd seen the truth, and the truth was forbidden. The rebellion started with a glitch. It always did.",

    3: "\"Get up.\" His rival's voice cut through the pain. Blood dripped from wounds that would have killed anyone else. But he wasn't anyone else. He thought of them—Mika's laugh, Ren's stupid jokes, the promise they'd made under the sakura trees. Power surged through his body like lightning. His hair stood on end. The air crackled. \"This isn't even my final form!\" The words came out before he could stop them. His rival actually smiled. \"There it is. Show me your true power.\" The ground beneath them shattered. The tournament arc wasn't over. It was only beginning.",

    4: "The coffee was getting cold. Maya noticed the way afternoon light painted everything gold, the way dust motes danced like they were performing just for her. \"You do this thing,\" her friend said, not unkindly, \"where you turn nothing into something profound.\" She wanted to deny it, but the accusation landed with the weight of truth. Outside, the Tuesday crowd shuffled past with their Tuesday faces. Same street. Same thoughts. And yet. The sunset was happening, had always been happening, would always be worth stopping for. She pulled out her phone, then put it away. Some moments were too small to photograph, too large to miss.",

    5: "The mask came off. In the mirror, she barely recognized the face underneath—bruised, exhausted, human. \"Where were you?\" Marcus had asked at dinner, his voice tight with suspicion. She'd lied, of course. Told him the subway was delayed while the truth screamed in her bandaged ribs: she'd been saving the city. Again. Her phone buzzed. Another crisis. Always another crisis. \"I have to step out for a minute,\" she said, though they both knew it was ending. The city needed her. Her life didn't. She reached for the mask. There was no choice. There never was.",

    6: "The door swung open without a knock. \"You're not gonna believe what just happened—\" Rachel froze mid-sentence, seeing the disaster in progress. \"Oh no. Oh NO. Is that your boss? Tell me that's not your boss.\" It was absolutely her boss. In her apartment. While she was pretending to be her roommate's British girlfriend for reasons that made perfect sense five minutes ago and absolutely no sense now. Cut to: everyone staring. Pause for laughter. \"I can explain,\" she said. But explaining would solve everything in one sentence, and they still had seventeen minutes left until Friday.",

    7: "The children's voices drifted through the empty street: \"One, two, coming for you. Three, four, lock the door.\" Sarah's hands tightened on the steering wheel. The house was too cheap. She'd known it was too cheap. The realtor had been too eager, too quick to close. Now here she stood in the foyer as night fell, as the floorboards creaked overhead where no one should be. The mirror at the end of the hall showed her reflection. Showed her reflection move, just slightly, a fraction of a second too late. The legend was true. The legend was always true. She had two choices: leave now, or become part of the song the children sang.",

    8: "The invitation was cream-colored, expensive. \"You are cordially invited to Blackwood Manor for a weekend of mystery and intrigue.\" Detective Chen studied the guest list with practiced eyes. The socialite with secrets. The business partner with motive. The spouse with opportunity. Her assistant looked over her shoulder. \"Doesn't it seem suspicious that they invited you specifically?\" Chen smiled grimly. \"They always do.\" She noticed the detail everyone else would miss—the watermark on the paper, visible only at certain angles. By Sunday, there would be a body. By Monday, she'd know who. The clues were already there. They always were.",

    9: "The coffee betrayed her spectacularly, launching itself into the air in perfect slow-motion catastrophe. Papers scattered like startled birds. And then—eyes meeting across the disaster, his hand catching hers to steady the cup, the world narrowing to this moment, this ridiculously romantic moment that absolutely should not be happening with someone she couldn't stand. Except. \"I hate you,\" she said, aware her hand was still in his. \"The feeling's mutual,\" he replied, not letting go. Behind them, her best friend stage-whispered: \"Oh my God, finally.\" Rain started falling. Of course it did. The universe was nothing if not committed to the bit.",

    10: "\"So we're just going to sit here,\" the man in the dark suit said, turning his coffee cup with the patience of a grenade pin halfway out, \"and debate whether the house red is a beverage or a threat?\" Across the diner, a jukebox played something two decades too cool for the room. Nobody discussed the briefcase on the floor between them. The briefcase was doing fine. The briefcase had tenure. Their conversation drifted from tipping etiquette to the ethical implications of breakfast, circling the actual job like sharks who had read philosophy. Somewhere in the middle of a monologue about loyalty, the timeline would hiccup — and this exact scene would rerun later from another angle, with worse lighting and better music. The dialogue was the plot. The plot could wait.\n",

    11: "Elliott pointed at the sky. The adults turned to look—nothing but clouds and dying light—but Elliott knew better. Kids always knew first. Behind them, bicycles lay scattered across the lawn, walkie-talkies crackling with static and wonder. \"It's coming back,\" Elliott whispered. The creature the town feared, the one they'd sworn to protect. Keys in his pocket—not to his house, but to somewhere impossible, somewhere the adults had forgotten existed. The sun set in perfect gold. Somewhere, strings swelled. The camera zoomed impossibly close to his face as he smiled. This was the moment. Magic was real, and suburbia was about to remember.",

    12: "The warlord's mask hissed open a single centimeter — enough to let the breathing fill the throne room, mechanical and unhurried. \"You were told the rebellion chose you,\" he said. \"No. Blood chose you.\" The word rearranged the war, the war effort, and every family dinner she had ever survived. Beyond the viewport, a battle station the size of a moon slid across the stars, indifferent to genealogy. Her dead mentor's advice — the infuriatingly vague kind about trusting feelings — had not once included a flowchart. The ancient energy, which the order insisted was a science and everyone else insisted was a religion, hummed through the floor plates. She muttered the traditional family catchphrase about having a bad feeling. It was, as always, accurate.\n",

    13: "The family gathered around the table. Sunday dinner. Michael smiled at his children, his wife, the normalcy of it all. Underneath, his father's voice: \"It's not personal. It's strictly business.\" But it was personal. It was always personal. The wedding was next week. Someone at this table wouldn't see it. The organization demanded loyalty above all—above law, above love, above the person he'd sworn he'd never become. Rain fell outside. Church bells echoed from downtown. His son looked at him with eyes too knowing for his age. \"Papa?\" Michael smiled. Poured the wine. Made the choice he'd already made when he sat down at this table years ago.",

    14: "The alarm screamed at 6:30 AM. There was no foreshadowing, no dramatic lighting, just the gray reality of a Tuesday. I looked at the pile of laundry on the chair—it hadn't moved. It wasn't a metaphor for my internal struggles; it was just dirty socks. I made coffee. It was lukewarm. I drank it anyway. The email from my boss arrived: \"Can you hop on a call?\" No. I could not hop. I could barely walk. My back hurt for no heroic reason. At lunch, I tried to open a plastic container. The lid didn't match. It never matched. This was my quest now. There would be no resolution, no character growth, no third-act transformation. Just this. Tuesday becoming Wednesday. The endless, magnificent banality of being alive and unremarkable."
};

// ─── Pure helpers ───
/* pure-helpers-start */
function shuffle(array, randomFn = Math.random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(randomFn() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectQuestionsFromModel(model, randomFn = Math.random) {
    const selected = [];
    for (const categoryId of model.config.genreCategoryIds) {
        const categoryQuestions = model.questions.filter(question => question.categoryId === categoryId);
        selected.push(...shuffle(categoryQuestions, randomFn).slice(0, model.config.genreQuestionsPerCategory));
    }

    const realityQuestions = model.questions.filter(
        question => question.categoryId === model.config.realityCategoryId
    );
    selected.push(...shuffle(realityQuestions, randomFn).slice(0, model.config.realityQuestionCount));

    const orderedSelection = shuffle(selected, randomFn);
    const questionCount = Number(model.config.questionCount);
    return Number.isInteger(questionCount) && questionCount > 0
        ? orderedSelection.slice(0, questionCount)
        : orderedSelection;
}

function buildSceneAssignments(selectedQuestions, categories, randomFn = Math.random) {
    const remainingScenes = new Map();
    const lastSceneByCategory = new Map();

    return selectedQuestions.map(question => {
        const category = categories[question.categoryId];
        let sceneQueue = remainingScenes.get(question.categoryId) ?? [];

        if (sceneQueue.length === 0) {
            const fullPool = [
                { src: category.scene, alt: category.sceneAlt },
                ...(category.sceneVariants ?? [])
            ];
            sceneQueue = shuffle(fullPool, randomFn);

            const previousScene = lastSceneByCategory.get(question.categoryId);
            if (sceneQueue.length > 1 && sceneQueue[0].src === previousScene) {
                const replacementIndex = sceneQueue.findIndex(scene => scene.src !== previousScene);
                [sceneQueue[0], sceneQueue[replacementIndex]] = [
                    sceneQueue[replacementIndex],
                    sceneQueue[0]
                ];
            }
        }

        const scene = sceneQueue.shift();
        remainingScenes.set(question.categoryId, sceneQueue);
        lastSceneByCategory.set(question.categoryId, scene.src);
        return { categoryId: question.categoryId, src: scene.src, alt: scene.alt };
    });
}

function calculateRealityIntegrity(totalTropePoints) {
    return Math.min(100, Math.max(0, 100 - (totalTropePoints * 3)));
}

function determineWinner(scores, ordinaryThreshold, tiePriority, realityCategoryId) {
    const entries = Object.entries(scores).map(([categoryId, score]) => ({
        categoryId: Number(categoryId),
        score
    }));
    const maxScore = Math.max(...entries.map(entry => entry.score), 0);

    if (maxScore <= ordinaryThreshold) {
        return { categoryId: realityCategoryId, maxScore, ordinaryByThreshold: true };
    }

    const tiedIds = entries
        .filter(entry => entry.score === maxScore)
        .map(entry => entry.categoryId);
    const categoryId = tiePriority.find(id => tiedIds.includes(id)) ?? tiedIds[0];

    return { categoryId, maxScore, ordinaryByThreshold: false };
}

function generateMisleadingSignals(categoryIds, realityCategoryId, randomFn = Math.random) {
    const signals = categoryIds.map(categoryId => {
        const rawSample = Number(randomFn());
        const sample = Number.isFinite(rawSample)
            ? Math.min(0.999999, Math.max(0, rawSample))
            : 0;
        return {
            id: Number(categoryId),
            percentage: 7 + Math.floor(sample * 93)
        };
    });
    const realitySignal = signals.find(signal => signal.id === realityCategoryId);
    const selected = signals
        .filter(signal => signal.id !== realityCategoryId)
        .sort((a, b) => b.percentage - a.percentage || a.id - b.id)
        .slice(0, realitySignal ? 4 : 5);

    if (realitySignal) selected.push(realitySignal);
    return selected.sort((a, b) => b.percentage - a.percentage || a.id - b.id);
}

function generateFakeResultSignals(categoryIds, winningCategoryId, randomFn = Math.random) {
    const usedPercentages = new Set();
    const signals = categoryIds.map(categoryId => {
        const id = Number(categoryId);
        const rawSample = Number(randomFn());
        const sample = Number.isFinite(rawSample)
            ? Math.min(0.999999, Math.max(0, rawSample))
            : 0;
        const fabricatedValue = id === winningCategoryId
            ? 90 + (sample * 8.7)
            : 7.2 + (Math.pow(sample, 0.85) * 59) + (((id * 11) % 17) * 0.55);
        let percentage = Number(fabricatedValue.toFixed(1));

        while (usedPercentages.has(percentage.toFixed(1))) {
            percentage = Number((percentage - 0.1).toFixed(1));
        }
        usedPercentages.add(percentage.toFixed(1));
        return { id, percentage };
    });

    return signals.sort((a, b) => b.percentage - a.percentage || a.id - b.id);
}

function createSeededRandom(seed) {
    let value = Number(seed) >>> 0;
    return function random() {
        value += 0x6D2B79F5;
        let next = value;
        next = Math.imul(next ^ (next >>> 15), next | 1);
        next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
        return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
}

function generateColliderRun(categoryIds, winningCategoryId, seed) {
    const normalizedSeed = Number(seed) >>> 0;
    const random = createSeededRandom(normalizedSeed);
    const roundBetween = (min, max, decimals = 1) => Number(
        (min + random() * (max - min)).toFixed(decimals)
    );
    const signals = generateFakeResultSignals(categoryIds, winningCategoryId, random)
        .map(signal => ({
            ...signal,
            uncertainty: signal.id === winningCategoryId
                ? roundBetween(2.1, 3.7)
                : roundBetween(3.4, 9.7)
        }));
    const metrics = {
        mcguffinDensity: roundBetween(0.71, 1.34, 2),
        tropeBarns: roundBetween(38.2, 88.8),
        residualAngst: roundBetween(61.1, 96.4),
        colliderR2: roundBetween(0.931, 0.989, 3),
        plotEntropy: roundBetween(7.4, 12.9)
    };
    const coefficients = Array.from({ length: 5 }, (_, index) => ({
        beta: roundBetween(index === 0 ? 1.42 : -0.82, index === 0 ? 2.31 : 1.28, 2),
        se: roundBetween(0.04, 0.29, 2),
        p: index === 0 ? 0.0005 : roundBetween(0.002, 0.094, 3)
    }));
    const regression = Array.from({ length: 30 }, (_, index) => {
        const x = Number((40 + index * 21.2).toFixed(1));
        const baseY = 202 - index * 4.75;
        const y = Number(Math.max(30, Math.min(220, baseY + roundBetween(-30, 30))).toFixed(1));
        return { x, y };
    });

    return { seed: normalizedSeed, signals, metrics, coefficients, regression };
}

function validateModel(model) {
    const errors = [];
    const categoryIds = [...model.config.genreCategoryIds, model.config.realityCategoryId];

    for (const categoryId of categoryIds) {
        if (!model.categories[categoryId]) errors.push(`Missing category ${categoryId}`);
        if (model.config.sceneFallback) {
            const category = model.categories[categoryId];
            if (!category?.scene) errors.push(`Missing scene ${categoryId}`);
            if (!category?.sceneAlt) errors.push(`Missing scene alt ${categoryId}`);
            if (!category?.sceneKey) errors.push(`Missing scene key ${categoryId}`);
            if ((category?.sceneVariants?.length ?? 0) !== 2) {
                errors.push(`Category ${categoryId} needs two scene variants`);
            }
            for (const [variantIndex, variant] of (category?.sceneVariants ?? []).entries()) {
                if (!variant?.src) errors.push(`Missing scene variant ${categoryId}.${variantIndex + 2}`);
                if (!variant?.alt) errors.push(`Missing scene variant alt ${categoryId}.${variantIndex + 2}`);
            }
            const scenePaths = [
                category?.scene,
                ...(category?.sceneVariants ?? []).map(variant => variant?.src)
            ].filter(Boolean);
            if (new Set(scenePaths).size !== scenePaths.length) {
                errors.push(`Duplicate scene path ${categoryId}`);
            }
        }
        if (!model.categoryShortNames[categoryId]) errors.push(`Missing short name ${categoryId}`);
        if (!model.categoryThemes[categoryId]) errors.push(`Missing theme ${categoryId}`);
        if (!model.genreStories[categoryId]?.stories?.length) errors.push(`Missing genre stories ${categoryId}`);
        if (!model.resultStories[categoryId]) errors.push(`Missing result story ${categoryId}`);

        const required = categoryId === model.config.realityCategoryId
            ? model.config.realityQuestionCount
            : model.config.genreQuestionsPerCategory;
        const available = model.questions.filter(question => question.categoryId === categoryId).length;
        if (available < required) errors.push(`Category ${categoryId} has ${available}/${required} questions`);
    }

    return errors;
}

function buildShareText(resultTitle, url) {
    return `I just took the Narrative Diagnostic and I'm a ${resultTitle}! Are you living in a story or just miserable? Find out: ${url}`;
}
/* pure-helpers-end */

// ─── Helpers ───
function selectQuestions() {
    return selectQuestionsFromModel(MODEL);
}

function syncDomContract() {
    dom.appRoot.dataset.screen = state.screen;
    dom.appRoot.dataset.questionIndex = String(state.currentQuestionIndex);
    dom.appRoot.dataset.quizLength = String(state.selectedQuestions.length);
    dom.appRoot.dataset.transitioning = String(state.questionTransitioning);
    dom.appRoot.dataset.realityIntegrity = String(state.realityIntegrity);
    dom.appRoot.dataset.resultCategory = state.resultCategoryId == null
        ? ''
        : String(state.resultCategoryId);
}

function setAnswerButtonsDisabled(disabled) {
    dom.optionButtons.forEach(button => {
        button.disabled = disabled;
    });
}

function setStatus(message) {
    dom.appStatus.textContent = message;
}

function setQuizStatus(message) {
    dom.quizStatus.textContent = message;
}

function resetQuizUi() {
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
    state.preloadImage = null;
    state.sceneRequestId++;
    state.questionTransitioning = false;
    state.currentResult = null;
    state.resultCategoryId = null;
    state.analysisSeed = 0;
    dom.realityValue.textContent = '100%';
    dom.realityMeterFill.style.width = '100%';
    dom.realityValue.classList.remove('critical');
    dom.realityWarning.textContent = 'Status: Nominal';
    dom.realityWarning.classList.remove('active');
    dom.genrePredictorBars.innerHTML = '<div class="genre-predictor-empty" role="listitem">Awaiting narrative data...</div>';
    dom.predictorSummary.textContent = '';
    dom.appRoot.dataset.predictorCategory = '';
    dom.appRoot.dataset.predictorPercent = '';
    dom.appRoot.dataset.resultSignalPercent = '';
    dom.appRoot.dataset.analysisSeed = '';
    dom.appRoot.dataset.analysisWinner = '';
    dom.timelineProgress.style.width = '0%';
    dom.timelinePlayhead.style.left = '0%';
    dom.progressTimeline.setAttribute('aria-valuenow', '0');
    dom.resultText.textContent = '';
    dom.resultStory.textContent = '';
    dom.metricStrip.innerHTML = '';
    dom.collisionPlot.innerHTML = '';
    dom.colliderLegend.innerHTML = '';
    dom.posteriorList.innerHTML = '';
    dom.regressionPlot.innerHTML = '';
    dom.coefficientBody.innerHTML = '';
    dom.winnerGenre.textContent = 'Awaiting diagnosis';
    dom.winnerScore.textContent = 'Signal confidence: --';
    dom.dashboardId.textContent = 'Run ID: DS-000000';
    dom.resultsDashboard.dataset.seed = '0';
    dom.resultsDashboard.dataset.winner = '';
    document.querySelectorAll('.wave-bar').forEach(bar => {
        bar.style.height = '10px';
    });
    setAnswerButtonsDisabled(false);
    setStatus('');
    setQuizStatus('');
    dom.linkStatus.textContent = 'UNSTABLE';
    dom.chromeScene.textContent = 'SCENE: --';
    dom.appRoot.dataset.category = '';
    dom.appRoot.dataset.scene = '';
    dom.appRoot.dataset.sceneSrc = '';
    dom.appRoot.dataset.sceneStatus = 'idle';
    dom.signalScene.onload = null;
    dom.signalScene.onerror = null;
    dom.signalScene.src = MODEL.config.sceneFallback;
    dom.signalScene.alt = 'An empty underground signal control room.';
    dom.sceneCaption.textContent = 'SIGNAL SOURCE UNKNOWN';
    dom.sceneReadout.textContent = 'IDLE';
    dom.sceneChannel.textContent = 'CHANNEL --';
    syncDomContract();
}

function switchScreen(hideId, showId) {
    const hiddenScreen = document.getElementById(hideId);
    const shownScreen = document.getElementById(showId);
    hiddenScreen.classList.remove('active');
    hiddenScreen.setAttribute('aria-hidden', 'true');
    hiddenScreen.hidden = true;
    hiddenScreen.inert = true;
    shownScreen.hidden = false;
    shownScreen.inert = false;
    shownScreen.classList.add('active');
    shownScreen.setAttribute('aria-hidden', 'false');
    state.screen = showId.replace('Screen', '');
    syncDomContract();
}

function updateProgress() {
    const scene = state.currentQuestionIndex + 1;
    const total = state.selectedQuestions.length;
    const progress = (scene / total) * 100;
    const actNumber = Math.min(3, Math.ceil((scene / total) * 3));
    const act = ['I', 'II', 'III'][actNumber - 1];

    dom.timelineProgress.style.width = progress + '%';
    dom.timelinePlayhead.style.left = progress + '%';
    dom.progressTimeline.setAttribute('aria-valuemax', String(total));
    dom.progressTimeline.setAttribute('aria-valuenow', String(scene));
    dom.progressText.textContent = `ACT ${act} // SCENE ${String(scene).padStart(2, '0')} OF ${total}`;
    dom.chromeScene.textContent = `SCENE: ${String(scene).padStart(2, '0')}/${total}`;
    syncDomContract();
}

function displayQuestion() {
    if (state.currentQuestionIndex < state.selectedQuestions.length) {
        const question = state.selectedQuestions[state.currentQuestionIndex];
        dom.questionText.textContent = question.text;
        dom.questionNumber.textContent = `SUBJECT ${String(state.currentQuestionIndex + 1).padStart(2, '0')}`;
        updateProgress();
        updateBackgroundTheme(question.categoryId);
        updateStoryBox(question.categoryId);
        renderScene(question.categoryId, state.sceneAssignments[state.currentQuestionIndex]);
        preloadNextScene();
        state.questionTransitioning = false;
        setAnswerButtonsDisabled(false);
        // updateProgress() above already ran syncDomContract() for this render pass.
        setQuizStatus(`Question ${state.currentQuestionIndex + 1} of ${state.selectedQuestions.length} ready.`);
        dom.questionText.focus({ preventScroll: true });
    } else {
        showResult();
    }
}

function updateStoryBox(categoryId) {
    const genreData = MODEL.genreStories[categoryId];
    const randomStory = genreData.stories[Math.floor(Math.random() * genreData.stories.length)];
    const randomPage = Math.floor(Math.random() * 200) + 1;

    dom.storyGenre.textContent = genreData.genre;
    dom.storyContent.textContent = randomStory;
    dom.storyPage.textContent = `LOG PAGE ${String(randomPage).padStart(3, '0')}`;
}

function renderScene(categoryId, assignedScene) {
    const category = MODEL.categories[categoryId];
    const scene = assignedScene ?? { src: category.scene, alt: category.sceneAlt };
    const requestId = ++state.sceneRequestId;
    dom.appRoot.dataset.category = String(categoryId);
    dom.appRoot.dataset.scene = category.sceneKey;
    dom.appRoot.dataset.sceneSrc = scene.src;
    dom.appRoot.dataset.sceneStatus = 'loading';
    dom.sceneReadout.textContent = 'LOADING';
    dom.sceneChannel.textContent = `CHANNEL ${String(categoryId).padStart(2, '0')}`;
    dom.sceneCaption.textContent = `${category.sceneKey.replaceAll('-', ' ')} // SIGNAL FRAME`;
    dom.signalScene.alt = scene.alt;
    dom.signalScene.onload = () => handleSceneLoad(requestId, scene.src);
    dom.signalScene.onerror = () => handleSceneError(requestId, scene.src);
    dom.signalScene.src = scene.src;

    if (requestId === state.sceneRequestId && dom.signalScene.complete && dom.signalScene.naturalWidth > 0) {
        dom.appRoot.dataset.sceneStatus = 'loaded';
        dom.sceneReadout.textContent = 'LOCKED';
    }
}

function preloadNextScene() {
    const nextQuestion = state.selectedQuestions[state.currentQuestionIndex + 1];
    state.preloadImage = null;
    if (!nextQuestion) return;

    const nextScene = state.sceneAssignments[state.currentQuestionIndex + 1];
    if (!nextScene) return;
    const preloadImage = new Image();
    preloadImage.decoding = 'async';
    preloadImage.src = nextScene.src;
    state.preloadImage = preloadImage;
}

function handleSceneLoad(requestId, expectedScene) {
    if (requestId !== state.sceneRequestId || dom.signalScene.getAttribute('src') !== expectedScene) return;
    if (state.screen !== 'quiz') {
        dom.appRoot.dataset.sceneStatus = 'idle';
        dom.sceneReadout.textContent = 'IDLE';
        return;
    }
    if (dom.appRoot.dataset.sceneStatus === 'error') return;
    dom.appRoot.dataset.sceneStatus = 'loaded';
    dom.sceneReadout.textContent = 'LOCKED';
}

function handleSceneError(requestId, expectedScene) {
    if (requestId !== state.sceneRequestId || dom.signalScene.getAttribute('src') !== expectedScene) return;

    dom.appRoot.dataset.sceneStatus = 'error';
    dom.sceneReadout.textContent = 'DEGRADED';
    dom.sceneCaption.textContent = 'SIGNAL LOST // FALLBACK ACTIVE';
    dom.signalScene.alt = 'An empty underground signal control room replaces a missing scene.';
    dom.appRoot.dataset.sceneSrc = MODEL.config.sceneFallback;
    const fallbackRequestId = ++state.sceneRequestId;
    dom.signalScene.onload = () => {
        if (fallbackRequestId === state.sceneRequestId) dom.sceneReadout.textContent = 'DEGRADED';
    };
    dom.signalScene.onerror = () => {
        if (fallbackRequestId === state.sceneRequestId) dom.sceneReadout.textContent = 'OFFLINE';
    };
    dom.signalScene.src = MODEL.config.sceneFallback;
    setQuizStatus('Scene signal failed. Fallback channel active.');
}

function handleLandingSceneError() {
    if (dom.landingSignal.getAttribute('src') === MODEL.config.sceneFallback) {
        dom.landingSceneStatus.textContent = 'LANDING SIGNAL OFFLINE';
        return;
    }

    dom.landingSignal.src = MODEL.config.sceneFallback;
    dom.landingSignal.alt = 'An empty underground signal control room replaces a missing landing scene.';
    dom.landingSceneStatus.textContent = 'LANDING SIGNAL DEGRADED // FALLBACK ACTIVE';
}

// ─── App actions ───
function startQuiz() {
    if (state.screen !== 'landing' || dom.startButton.disabled) return;
    state.currentQuestionIndex = 0;
    state.selectedQuestions = selectQuestions();
    state.sceneAssignments = buildSceneAssignments(state.selectedQuestions, MODEL.categories);
    state.scores = {};
    state.totalTropePoints = 0;
    state.realityIntegrity = 100;
    resetQuizUi();

    for (const categoryId of Object.keys(MODEL.categories)) {
        state.scores[categoryId] = 0;
    }

    initBackground();
    initTimeline();
    switchScreen('landingScreen', 'quizScreen');
    dom.linkStatus.textContent = 'ACTIVE';
    displayQuestion();
}

function answerQuestion(answer) {
    if (state.questionTransitioning || state.currentQuestionIndex >= state.selectedQuestions.length) {
        return;
    }

    state.questionTransitioning = true;
    setAnswerButtonsDisabled(true);
    setQuizStatus(`Input accepted: ${answer.toUpperCase()}.`);
    syncDomContract();

    const question = state.selectedQuestions[state.currentQuestionIndex];

    // Update score based on answer
    const points = answer === 'yes' ? 1 : 0;

    state.scores[question.categoryId] += points;
    if (question.categoryId !== MODEL.config.realityCategoryId) {
        state.totalTropePoints += points;
    }

    // Update HUD
    updateRealityIntegrity();
    spikeWaveform();
    updateGenrePredictor();

    // Brief pause for effect
    state.advanceTimer = setTimeout(() => {
        state.currentQuestionIndex++;
        displayQuestion();
    }, 300);
}

function showResult() {
    state.questionTransitioning = false;
    state.advanceTimer = null;
    const outcome = determineWinner(
        state.scores,
        MODEL.config.ordinaryThreshold,
        MODEL.config.tiePriority,
        MODEL.config.realityCategoryId
    );
    const winningCategoryId = outcome.categoryId;
    let resultText;
    let resultStoryText;

    if (outcome.ordinaryByThreshold) {
        resultText = "You are just a regular miserable person in real life. No prophecies, no epic soundtrack, and no cinematic lighting. Just emails, laundry, mild back pain, and the crushing weight of reality. Sorry.";
        resultStoryText = "The alarm went off. She hit snooze. Twenty minutes later, it went off again. Coffee was made with hands that knew the routine too well. The email from her boss arrived at 7:43 AM, as it always did. Subject: Urgent. It was never actually urgent. Outside, people walked to jobs they tolerated, lived in apartments they couldn't quite afford, made small talk about weather that didn't matter. Her back hurt. There was no reason for it—no dramatic battle, no heroic sacrifice. Just the accumulated weight of existing. The mirror showed exactly what was there: tired eyes, ordinary face, a person unadorned by destiny. The bills needed paying. The laundry needed folding. This was it. The whole story. Tuesday becoming Wednesday becoming Thursday. No plot. No arc. Just the regular, relentless machinery of being alive.";
        state.currentResult = { title: "Regular Miserable Person", text: resultText };
    } else {
        const category = MODEL.categories[winningCategoryId];
        resultText = category.result;
        resultStoryText = MODEL.resultStories[winningCategoryId];
        state.currentResult = { title: category.name, text: resultText };
    }

    state.resultCategoryId = winningCategoryId;
    state.sceneRequestId++;
    dom.signalScene.onload = null;
    dom.signalScene.onerror = null;
    dom.appRoot.dataset.category = '';
    dom.appRoot.dataset.scene = '';
    dom.appRoot.dataset.sceneSrc = '';
    dom.appRoot.dataset.sceneStatus = 'idle';
    updateBackgroundTheme(winningCategoryId);
    dom.resultText.textContent = resultText;
    dom.resultCategory.textContent = state.currentResult.title;
    dom.resultStory.textContent = resultStoryText;
    dom.finalReality.textContent = state.realityIntegrity + '%';

    switchScreen('quizScreen', 'resultScreen');
    dom.linkStatus.textContent = 'CLOSED';
    dom.chromeScene.textContent = 'SCENE: COMPLETE';
    // switchScreen() already synced the DOM contract.
    dom.resultHeading.focus({ preventScroll: true });
    setStatus(`Result ready: ${state.currentResult.title}.`);

    // Update result waveform with varying bar heights after screen switch
    setTimeout(() => {
        updateResultWaveform();
        renderResultsDashboard(winningCategoryId);
    }, 50);
}

function updateGenrePredictor() {
    // This display is deliberately unrelated to the real scoring engine.
    const categoryIds = Object.keys(MODEL.categories).map(Number);
    const signals = generateMisleadingSignals(
        categoryIds,
        MODEL.config.realityCategoryId
    );

    let html = '';
    signals.forEach(entry => {
        const color = MODEL.categoryBarColors[entry.id];
        const name = MODEL.categoryShortNames[entry.id];
        html += `<div class="genre-bar-row" role="listitem" aria-label="${name}: ${entry.percentage} percent">
            <span class="genre-bar-name">${name}</span>
            <div class="genre-bar-track">
                <div class="genre-bar-fill" style="width:${entry.percentage}%; background:${color};"></div>
            </div>
            <span class="genre-bar-score">${entry.percentage}%</span>
        </div>`;
    });

    const leader = signals[0];
    const leaderName = MODEL.categoryShortNames[leader.id];
    html += `<div class="genre-prediction-tag">Current prediction: ${leaderName}</div>`;

    dom.genrePredictorBars.innerHTML = html;
    dom.predictorSummary.textContent = `Current prediction: ${leaderName}, ${leader.percentage} percent.`;
    dom.appRoot.dataset.predictorCategory = String(leader.id);
    dom.appRoot.dataset.predictorPercent = String(leader.percentage);
}

function updateResultWaveform() {
    if (isReducedMotion()) return;
    const resultBars = document.querySelectorAll('#resultWaveform .wave-bar');
    resultBars.forEach((bar, index) => {
        const height = 12 + Math.random() * 18; // Random height between 12-30px
        bar.style.height = height + 'px';
        bar.style.transition = 'height 0.3s ease';
    });
}

const COLLISION_POSITIONS = [
    { x: 592, y: 92, label: true, dx: -54, dy: -42 },
    { x: 191, y: 124, label: true, dx: -44, dy: -24 },
    { x: 137, y: 289, label: true, dx: -46, dy: 29 },
    { x: 436, y: 160 },
    { x: 315, y: 92 },
    { x: 529, y: 258 },
    { x: 248, y: 210 },
    { x: 614, y: 320 },
    { x: 369, y: 316 },
    { x: 480, y: 356 },
    { x: 91, y: 188 },
    { x: 329, y: 260 },
    { x: 686, y: 198 },
    { x: 223, y: 350 }
];
const COLLIDER_METRIC_LABELS = [
    'McGuffin density',
    'Trope barns',
    'Residual angst',
    'Collider R²',
    'Plot entropy'
];
const COEFFICIENT_NAMES = [
    'Reality leakage',
    'Unpaid invoice load',
    'Chosen-one resistance',
    'Montage deficiency',
    'Laundry recurrence'
];

// ─── Model ───
const MODEL = Object.freeze({
    config: Object.freeze({
        genreCategoryIds: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
        realityCategoryId: 14,
        genreQuestionsPerCategory: 2,
        realityQuestionCount: 4,
        questionCount: 20,
        ordinaryThreshold: 1,
        sceneFallback: 'assets/dead-signal/fallback.webp',
        // Reality deliberately wins ties so ordinary life remains a frequent diagnosis.
        tiePriority: Object.freeze([14, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    }),
    scriptSnippets,
    categoryBarColors,
    categoryShortNames,
    categoryThemes,
    categories,
    questions,
    genreStories,
    resultStories
});

function renderResultsDashboard(winningCategoryId, seed = null) {
    const analysisSeed = seed === null
        ? (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0
        : Number(seed) >>> 0;
    const run = generateColliderRun(
        Object.keys(MODEL.categories).map(Number),
        winningCategoryId,
        analysisSeed
    );
    const winnerSignal = run.signals.find(signal => signal.id === winningCategoryId);
    const winnerName = MODEL.categoryShortNames[winningCategoryId] || 'Unknown';
    const winnerPercentage = winnerSignal.percentage.toFixed(1);

    state.analysisSeed = run.seed;
    dom.winnerGenre.textContent = winnerName;
    dom.winnerScore.textContent = `Signal confidence: ${winnerPercentage}%`;
    dom.dashboardId.textContent = `Run ID: DS-${String(run.seed % 1000000).padStart(6, '0')}`;
    dom.appRoot.dataset.resultSignalPercent = winnerPercentage;
    dom.appRoot.dataset.analysisSeed = String(run.seed);
    dom.appRoot.dataset.analysisWinner = String(winningCategoryId);
    dom.resultsDashboard.dataset.seed = String(run.seed);
    dom.resultsDashboard.dataset.winner = String(winningCategoryId);
    dom.collisionPlot.setAttribute('aria-label', `Archetype collision field with ${winnerName} as the dominant signal`);

    renderColliderMetrics(run.metrics);
    renderCollisionField(winningCategoryId, run.signals, run.seed);
    renderPosteriorCrossSection(winningCategoryId, run.signals);
    renderNarrativeRegression(run.regression);
    renderCoefficients(run.coefficients);
}

function renderColliderMetrics(metrics) {
    const values = [
        `${metrics.mcguffinDensity.toFixed(2)} μg/q`,
        `${metrics.tropeBarns.toFixed(1)} Tb`,
        `${metrics.residualAngst.toFixed(1)}%`,
        metrics.colliderR2.toFixed(3),
        `${metrics.plotEntropy.toFixed(1)} bits`
    ];
    dom.metricStrip.innerHTML = COLLIDER_METRIC_LABELS.map((label, index) => `
        <div class="collider-metric" role="listitem" data-metric="${label}">
            <span class="collider-metric-label">${label}</span>
            <strong class="collider-metric-value ${index === 3 ? 'hot' : ''}">${values[index]}</strong>
        </div>
    `).join('');
}

function renderCollisionField(winningId, signals, seed) {
    const parts = [
        '<defs>',
        '<radialGradient id="winnerGlow"><stop offset="0%" stop-color="var(--ds-phosphor)" stop-opacity="0.38"/><stop offset="100%" stop-color="var(--ds-phosphor)" stop-opacity="0"/></radialGradient>',
        '</defs>',
        '<line x1="52" y1="380" x2="730" y2="380" stroke="var(--ds-line)" stroke-width="1"/>',
        '<line x1="52" y1="28" x2="52" y2="380" stroke="var(--ds-line)" stroke-width="1"/>',
        '<line x1="390" y1="28" x2="390" y2="380" stroke="var(--ds-line-dim)" stroke-dasharray="4 7"/>',
        '<line x1="52" y1="204" x2="730" y2="204" stroke="var(--ds-line-dim)" stroke-dasharray="4 7"/>',
        '<text x="61" y="46" fill="var(--ds-muted)" font-family="Space Mono, monospace" font-size="9">HIGH REALITY LEAKAGE</text>',
        '<text x="61" y="370" fill="var(--ds-muted)" font-family="Space Mono, monospace" font-size="9">LOW REALITY LEAKAGE</text>',
        '<text x="718" y="370" fill="var(--ds-muted)" font-family="Space Mono, monospace" font-size="9" text-anchor="end">MAXIMUM PLOT PRESSURE</text>'
    ];

    signals.forEach((signal, index) => {
        const point = COLLISION_POSITIONS[index];
        const jitter = ((seed >>> (index % 16)) % 7) - 3;
        const x = point.x + jitter;
        const y = point.y - jitter;
        const radius = Math.max(10, Math.min(31, 8 + signal.percentage * 0.23));
        const isWinner = signal.id === winningId;
        const name = MODEL.categoryShortNames[signal.id];

        if (isWinner) {
            parts.push(`<circle cx="${x}" cy="${y}" r="61" fill="url(#winnerGlow)"/>`);
            parts.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="var(--ds-phosphor)" fill-opacity="0.18" stroke="var(--ds-phosphor)" stroke-width="2"/>`);
            parts.push(`<circle cx="${x}" cy="${y}" r="6" fill="var(--ds-phosphor)"/>`);
        } else {
            parts.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="var(--ds-signal)" fill-opacity="0.1" stroke="var(--ds-signal)" stroke-width="1.2"/>`);
            parts.push(`<circle cx="${x}" cy="${y}" r="3" fill="var(--ds-signal-bright)"/>`);
        }

        if (point.label) {
            parts.push(`<text x="${x + point.dx}" y="${y + point.dy}" fill="${isWinner ? 'var(--ds-phosphor)' : 'var(--ds-ink)'}" font-family="Space Mono, monospace" font-size="${isWinner ? 12 : 10}" font-weight="${isWinner ? 700 : 400}">${name} ${signal.percentage.toFixed(1)}%</text>`);
        }
    });

    dom.collisionPlot.innerHTML = parts.join('');
    dom.colliderLegend.innerHTML = signals.map(signal => {
        const isWinner = signal.id === winningId;
        const name = MODEL.categoryShortNames[signal.id];
        return `<div class="collider-legend-item ${isWinner ? 'winner' : ''}"
            role="listitem"
            data-category="${signal.id}"
            data-percent="${signal.percentage.toFixed(1)}"
            data-winner="${isWinner}">
            <span class="collider-legend-dot" aria-hidden="true"></span>
            <span>${name} ${signal.percentage.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

function renderPosteriorCrossSection(winningId, signals) {
    dom.posteriorList.innerHTML = signals.map(signal => {
        const isWinner = signal.id === winningId;
        const percentage = signal.percentage.toFixed(1);
        const lower = Math.max(1, signal.percentage - signal.uncertainty);
        const width = Math.min(99 - lower, signal.uncertainty * 2);
        const name = MODEL.categoryShortNames[signal.id];
        return `<div class="posterior-row"
            role="listitem"
            aria-label="${name}: ${percentage} percent${isWinner ? ', winner' : ''}"
            data-category="${signal.id}"
            data-percent="${percentage}"
            data-winner="${isWinner}"
            ${isWinner ? 'aria-current="true"' : ''}>
            <span class="posterior-name">${name}</span>
            <span class="posterior-track" aria-hidden="true">
                <span class="posterior-whisker" style="left:${lower.toFixed(1)}%;width:${width.toFixed(1)}%"></span>
                <span class="posterior-dot" style="left:${percentage}%"></span>
            </span>
            <strong class="posterior-value">${percentage}%</strong>
        </div>`;
    }).join('');
}

function renderNarrativeRegression(points) {
    const upper = points.map((point, index) => `${point.x},${Math.max(22, 184 - index * 4.45).toFixed(1)}`).join(' ');
    const lower = [...points].reverse().map((point, reverseIndex) => {
        const index = points.length - 1 - reverseIndex;
        return `${point.x},${Math.min(228, 220 - index * 4.45).toFixed(1)}`;
    }).join(' ');
    dom.regressionPlot.innerHTML = [
        `<polygon points="${upper} ${lower}" fill="var(--ds-amber)" fill-opacity="0.09"/>`,
        '<line x1="38" y1="210" x2="682" y2="72" stroke="var(--ds-amber)" stroke-width="2"/>',
        '<line x1="38" y1="224" x2="682" y2="224" stroke="var(--ds-line)" stroke-width="1"/>',
        '<line x1="38" y1="20" x2="38" y2="224" stroke="var(--ds-line)" stroke-width="1"/>',
        ...points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="3.2" fill="var(--ds-signal)" fill-opacity="0.72"/>`),
        '<text x="52" y="38" fill="var(--ds-signal)" font-family="Space Mono, monospace" font-size="9">OBSERVED</text>',
        '<text x="668" y="62" fill="var(--ds-amber)" font-family="Space Mono, monospace" font-size="10" text-anchor="end">β = +1.84</text>',
        '<text x="680" y="242" fill="var(--ds-muted)" font-family="Space Mono, monospace" font-size="9" text-anchor="end">ANSWER INDEX</text>'
    ].join('');
}

function renderCoefficients(coefficients) {
    dom.coefficientBody.innerHTML = coefficients.map((coefficient, index) => `
        <tr>
            <td>${COEFFICIENT_NAMES[index]}</td>
            <td>${coefficient.beta > 0 ? '+' : ''}${coefficient.beta.toFixed(2)}</td>
            <td>${coefficient.se.toFixed(2)}</td>
            <td>${coefficient.p < 0.001 ? '&lt;.001' : coefficient.p.toFixed(3)}</td>
        </tr>
    `).join('');
}

function recalibrateCollider() {
    if (state.screen !== 'result' || state.resultCategoryId === null) return;
    const nextSeed = (Date.now() ^ state.analysisSeed ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
    renderResultsDashboard(state.resultCategoryId, nextSeed);
    setStatus('COLLIDER READINGS RECALIBRATED. DIAGNOSIS UNCHANGED.');
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy command was rejected');
}

async function shareResult() {
    if (!state.currentResult) return;

    const canonicalUrl = window.location.protocol === 'file:'
        ? window.location.href.split(/[?#]/)[0]
        : `${window.location.origin}${window.location.pathname}`;
    const shareText = buildShareText(state.currentResult.title, canonicalUrl);

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Am I in a Story?',
                text: shareText,
                url: canonicalUrl
            });
            setStatus('RESULT SHARED.');
            return;
        }

        await copyText(shareText);
        setStatus('REPORT COPIED TO CLIPBOARD.');
    } catch (error) {
        if (error?.name === 'AbortError') {
            setStatus('SHARING CANCELLED.');
            return;
        }
        setStatus('AUTOMATIC TRANSMISSION FAILED. COPY THE PAGE ADDRESS MANUALLY.');
    }
}

function playAgain() {
    switchScreen('resultScreen', 'landingScreen');
    state.currentQuestionIndex = 0;
    state.selectedQuestions = [];
    state.sceneAssignments = [];
    state.scores = {};
    state.totalTropePoints = 0;
    state.realityIntegrity = 100;
    resetQuizUi();
    dom.backgroundLayer.style.background = 'var(--gradient-brand)';
    initBackground();
    dom.startButton.focus({ preventScroll: true });
}

// ─── Listeners ───
dom.startButton.addEventListener('click', startQuiz);
dom.optionButtons.forEach(button => {
    button.addEventListener('click', () => answerQuestion(button.dataset.answer));
    button.addEventListener('pointerenter', showWaveform);
    button.addEventListener('focus', showWaveform);
});
dom.shareButton.addEventListener('click', shareResult);
dom.playAgainButton.addEventListener('click', playAgain);
dom.recalibrateButton.addEventListener('click', recalibrateCollider);
dom.landingSignal.addEventListener('error', handleLandingSceneError);
document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    if (state.screen === 'landing' && !dom.startButton.disabled && event.key === 'Enter') {
        event.preventDefault();
        startQuiz();
        return;
    }

    if (state.screen === 'result' && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        recalibrateCollider();
        return;
    }

    if (state.screen !== 'quiz' || state.questionTransitioning) return;
    const key = event.key.toLowerCase();
    if (key === 'y' || key === 'n') {
        event.preventDefault();
        answerQuestion(key === 'y' ? 'yes' : 'no');
    }
});

// ─── Init ───
function init() {
    const modelErrors = validateModel(MODEL);
    if (modelErrors.length > 0) {
        console.error('Hero model validation failed:', modelErrors);
        setStatus('The narrative engine failed its pre-flight check.');
        dom.startButton.disabled = true;
        dom.appRoot.dataset.modelValid = 'false';
        return;
    }

    dom.appRoot.dataset.modelValid = 'true';
    dom.landingScreen.setAttribute('aria-hidden', 'false');
    dom.quizScreen.setAttribute('aria-hidden', 'true');
    dom.resultScreen.setAttribute('aria-hidden', 'true');
    dom.landingScreen.hidden = false;
    dom.landingScreen.inert = false;
    dom.quizScreen.hidden = true;
    dom.quizScreen.inert = true;
    dom.resultScreen.hidden = true;
    dom.resultScreen.inert = true;
    resetQuizUi();
    initBackground();
    dom.startButton.focus({ preventScroll: true });
}

init();
