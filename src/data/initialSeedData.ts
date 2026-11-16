import {
  Workspace,
  Universe,
  World,
  Article,
  EntityRelationship,
  WorldMap,
  TimelineEvent,
  CustomCalendar,
  WhiteboardBoard,
  Manuscript,
  NotebookNote,
  ProjectTask,
  InteractiveTable,
  RandomGenerator,
  RPGCampaign,
  IPPipelineAsset,
  CommunityPost
} from '../types/worldbuilding';

export const INITIAL_WORKSPACE: Workspace = {
  id: 'ws-solstice-studio',
  name: 'Solstice Creative IP Studio',
  description: 'Integrated multi-universe creative production workspace for transmedia novels, tabletop campaigns, and concept art bibles.',
  visibility: 'shared',
  storageUsedMb: 142.8,
  storageLimitMb: 5120,
  variables: {
    empire_name: 'Solaris Sovereignty',
    current_year: '418 SR',
    primary_currency: 'Aurean Crowns',
    magic_source: 'Resonant Aether'
  },
  members: [
    {
      id: 'mem-1',
      name: 'Elena Rostova',
      email: 'elena@solsticestudio.org',
      role: 'Workspace Owner',
      specialty: 'Lead Worldbuilder & Narrative Director',
      permissions: { canEditWorld: true, canPublish: true, canViewSecrets: true, canManageMembers: true, canExportData: true }
    },
    {
      id: 'mem-2',
      name: 'Marcus Vance',
      email: 'marcus@solsticestudio.org',
      role: 'Workspace Admin',
      specialty: 'Principal Concept Artist & Cartographer',
      permissions: { canEditWorld: true, canPublish: true, canViewSecrets: true, canManageMembers: true, canExportData: true }
    },
    {
      id: 'mem-3',
      name: 'Sora Takahashi',
      email: 'sora@solsticestudio.org',
      role: 'Editor',
      specialty: 'Lore Continuity & Manuscript Editor',
      permissions: { canEditWorld: true, canPublish: true, canViewSecrets: false, canManageMembers: false, canExportData: true }
    },
    {
      id: 'mem-4',
      name: 'Dante Moretti',
      email: 'dante@solsticestudio.org',
      role: 'Contributor',
      specialty: 'RPG Systems & Encounter Designer',
      permissions: { canEditWorld: true, canPublish: false, canViewSecrets: true, canManageMembers: false, canExportData: false }
    },
    {
      id: 'mem-5',
      name: 'Aria Chen',
      email: 'aria@solsticestudio.org',
      role: 'Reviewer',
      specialty: 'Sensitivity & Continuity Reviewer',
      permissions: { canEditWorld: false, canPublish: false, canViewSecrets: false, canManageMembers: false, canExportData: false }
    }
  ]
};

export const INITIAL_UNIVERSES: Universe[] = [
  {
    id: 'uni-aethelgard',
    workspaceId: 'ws-solstice-studio',
    name: 'Chronicles of the Aetherial Sea',
    description: 'High-aetherial cosmology governed by the Twin Moons, resonant ley-tides, and post-cataclysmic sky-archipelagos.',
    cosmologyNotes: 'Matter and memory are bound through Resonant Aether. Every 144 years, the Twin Moons align in the Eclipse of Crowns.'
  },
  {
    id: 'uni-helios',
    workspaceId: 'ws-solstice-studio',
    name: 'Helios Horizon Sector',
    description: 'Hard speculative science-fiction universe spanning Lagrange habitats, deep-mantle mining guilds, and relativistic couriers.',
    cosmologyNotes: 'No FTL communication; interstellar treaties depend on autonomous cryptographicledger beacons.'
  }
];

export const INITIAL_WORLDS: World[] = [
  {
    id: 'world-aethelgard',
    workspaceId: 'ws-solstice-studio',
    universeId: 'uni-aethelgard',
    universeName: 'Chronicles of the Aetherial Sea',
    name: 'Aethelgard: The Shattered Crown',
    genre: 'Arcane Geopolitical Fantasy',
    tags: ['Aetherpunk', 'Archipelago', 'Dynastic Intrigue', 'High Lore'],
    synopsis: 'Four centuries after the Sundering of the First Crown, sky-citadels and maritime republics vie for control over dormant Aether Wells while the Obsidian Synod stirs beneath the Caldera.',
    announcement: 'Canon Lock v2.4: Year 418 SR treaty boundaries finalized across all Act II manuscript chapters.',
    visibility: 'public',
    customDomain: 'aethelgard.codex.studio',
    accentColor: '#d97706',
    customCss: '.world-article-header { border-bottom: 1px solid rgba(217, 119, 6, 0.35); }',
    articleLayout: 'encyclopedia',
    updatedAt: '2026-11-13 14:40'
  },
  {
    id: 'world-vaeloria',
    workspaceId: 'ws-solstice-studio',
    universeId: 'uni-aethelgard',
    universeName: 'Chronicles of the Aetherial Sea',
    name: 'Vaeloria: Deep Sea Republics',
    genre: 'Abyssal Maritime Fantasy',
    tags: ['Bioluminescent', 'Submerged Cities', 'Guild Politics'],
    synopsis: 'Beneath the storm-wracked southern hemisphere lie the bathysphere domes and coral-forged merchant republics of Vaeloria.',
    announcement: 'Added 4 new abyssal trench markers and Pelagic Concordat diplomacy scores.',
    visibility: 'private',
    accentColor: '#0284c7',
    customCss: '',
    articleLayout: 'dossier',
    updatedAt: '2026-11-12 19:15'
  },
  {
    id: 'world-helios-nine',
    workspaceId: 'ws-solstice-studio',
    universeId: 'uni-helios',
    universeName: 'Helios Horizon Sector',
    name: 'Station Nine: Cygnus Ring',
    genre: 'Hard Sci-Fi / Orbital Political Thriller',
    tags: ['Orbital Ring', 'Zero-G Architecture', 'Hard Sci-Fi'],
    synopsis: 'A 40-kilometer rotating Stanford torus processing helium-3 harvests while navigating labor strikes and syndicate espionage.',
    announcement: 'Tech tree updated with fusion torch propulsion schematics.',
    visibility: 'password',
    accessCode: 'CYGNUS-09',
    accentColor: '#10b981',
    customCss: '',
    articleLayout: 'chronicle',
    updatedAt: '2026-11-10 11:05'
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-seraphina',
    worldId: 'world-aethelgard',
    title: 'Empress Seraphina Vance',
    aliases: ['Seraphina Vance', 'The Sunspire Sovereign', 'Seraphina'],
    templateType: 'Character',
    category: 'Characters',
    tags: ['Monarch', 'House Vance', 'Aether-Weaver', 'Protagonist'],
    summary: 'Current ruler of Sunspire Citadel and custodian of the fractured Crown of Solis, balancing reformist diplomacy against the Iron Covenant.',
    content: `Empress Seraphina Vance ascended the Alabaster Dais of Sunspire Citadel in the winter of 409 SR following the sudden disappearance of her father, Archon Valerius Vance, near the Shattered Caldera. Unlike her predecessors in House Vance, Seraphina refused to seal the outer sky-docks during the Aether Famine, earning fierce loyalty from the Free Sky-Mariners and bitter hostility from High Inquisitor Malakor of the Obsidian Synod.

Trained in both statecraft and high-order resonance weaving, she wields the Astral Scepter of Solis—an ancient conduit capable of stabilizing volatile Aether storms across a ten-league radius. She relies heavily on Lord Commander Kaelen Thorne to garrison the northern sky-gates while negotiating a fragile grain and aether-core treaty with the Iron Covenant.`,
    secretNotes: 'GM / Author Secret: Seraphina secretly communicates with her exiled brother Cassian Vance through encrypted resonance crystals. She knows the Crown of Solis is missing its third keystone.',
    spoilerWarning: 'Contains Act II revelations regarding the succession crisis of Sunspire Citadel.',
    templateValues: {
      fullName: 'Seraphina Aurelia Vance, Seventh Archon-Empress of Sunspire',
      alias: 'The Sunspire Sovereign, Daughter of the Dawn',
      age: '31 (Born 387 SR)',
      gender: 'Female (she/her)',
      species: 'High Solarian Human',
      occupation: 'Empress of Sunspire Citadel',
      personality: 'Measured, incisive, fiercely protective of civic scholars, yet burdened by sleepless vigilance.',
      motivation: 'Prevent a second Sundering by reforging the Concord of Three Crowns before the Twin Moons eclipse.',
      background: 'Educated at the Grand Athenaeum of Vaelis before being thrust into imperial regency at age twenty-two.',
      characterArc: 'From cautious institutional preserver to bold reformer willing to dismantle the imperial monopoly on Aether.',
      strengths: 'Strategic foresight, polyglot diplomacy, harmonic Aether stabilization.',
      weaknesses: 'Chronic Aether-burn in her right hand; reluctant to execute traitors within her own bloodline.',
      skills: 'High Solarian rhetoric, astrolabe navigation, rapier fencing, cipher cryptanalysis.',
      abilities: 'Solaris Harmonic Ward — projects a resonant dome that dampens kinetic and arcane bombardment.',
      appearance: 'Tall, silver-streaked sable hair braided with brass astrolabe rings; amber irises marked by faint luminous rings from Aether exposure.',
      costume: 'Deep indigo velvet state coat embroidered with copper constellation thread over lightweight sky-steel brigandine.',
      voice: 'Low contralto, unhurried cadence, switches effortlessly between Imperial High Solarian and Dockside Cant.',
      relationships: 'Lord Commander Kaelen Thorne (Sworn Shield & Confidant), High Inquisitor Malakor (Political Adversary), Lyra Vaelen (Chief Artificer).',
      gallery: 'Concept Portrait Sheet #CHAR-01 (Approved)',
      relatedLocations: 'Sunspire Citadel, Shattered Caldera',
      relatedOrganizations: 'House Vance, Iron Covenant, Obsidian Synod'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-kaelen', 'art-sunspire', 'art-caldera', 'art-malakor', 'art-scepter', 'art-iron-covenant', 'art-obsidian-synod', 'art-lyra'],
    galleryCaptions: ['State Portrait at the Alabaster Dais (415 SR)', 'Field Regalia during the Caldera Expedition'],
    versions: [
      { id: 'v-1', timestamp: '2026-11-01 10:00', author: 'Elena Rostova', note: 'Initial character bible import', contentSnapshot: 'Initial draft of Empress Seraphina Vance.' },
      { id: 'v-2', timestamp: '2026-11-13 14:20', author: 'Sora Takahashi', note: 'Added all 21 character attributes and Act II links', contentSnapshot: 'Expanded biography linking Kaelen Thorne, Sunspire Citadel, and the Astral Scepter of Solis.' }
    ],
    comments: [
      { id: 'cm-1', author: 'Marcus Vance', role: 'Workspace Admin', timestamp: '2 hours ago', text: 'Updated her costume notes to match the brass astrolabe motif in the Character Bible.' }
    ],
    wordCount: 342,
    updatedAt: '2026-11-13 14:20'
  },
  {
    id: 'art-kaelen',
    worldId: 'world-aethelgard',
    title: 'Lord Commander Kaelen Thorne',
    aliases: ['Kaelen Thorne', 'Kaelen', 'The Iron Kite'],
    templateType: 'Character',
    category: 'Characters',
    tags: ['Commander', 'Sky-Vanguard', 'Protagonist', 'Martial'],
    summary: 'Veteran sky-fleet tactician and commander of the Sunspire Vanguard who survived the Siege of Ashfall.',
    content: `Lord Commander Kaelen Thorne rose from the ranks of the Third Sky-Lancers during the Siege of Ashfall in 402 SR. Born in the foundry tiers of the Iron Covenant before defecting to Sunspire Citadel, Kaelen commands the Citadel's perimeter airships from the bastion of Skywatch Keep.

Though distrusted by old-blood aristocrats of House Vance, Kaelen’s tactical brilliance and unwavering devotion to Empress Seraphina Vance have thwarted three assassination attempts orchestrated by the Obsidian Synod. In battle, he carries a resonant halberd forged from Star-Fallen Orichalcum.`,
    secretNotes: 'Kaelen bears a dormant Synod blood-sigil branded onto his shoulder during his captivity in 401 SR.',
    spoilerWarning: '',
    templateValues: {
      fullName: 'Kaelen Voss Thorne',
      alias: 'The Iron Kite of Ashfall',
      age: '36 (Born 382 SR)',
      gender: 'Male (he/him)',
      species: 'Solarian Human',
      occupation: 'Lord Commander of the Sunspire Vanguard',
      personality: 'Stoic, dry-witted, hyper-observant of exits and wind shear.',
      motivation: 'Ensure Sunspire Citadel never suffers another Ashfall massacre.',
      background: 'Former foundry apprentice in the Iron Covenant who earned a battlefield commission.',
      characterArc: 'Learning to trust civilian alliances rather than relying solely on military containment.',
      strengths: 'Three-dimensional aerial fleet tactics, close-quarters halberd mastery.',
      weaknesses: 'Distrusts arcane rituals; recurring vertigo when unanchored from aether-harnesses.',
      skills: 'Airship helmsmanship, siege engineering, battlefield triage.',
      abilities: 'Gale-Step — short-range kinetic burst using aether-vent boots.',
      appearance: 'Weathered olive skin, cropped iron-gray hair, jagged lightning scar across his left collarbone.',
      costume: 'Charcoal storm-leather brigandine with the bronze hawk clasp of the Sky-Vanguard.',
      voice: 'Gravelly baritone, clipped military brevity.',
      relationships: 'Empress Seraphina Vance (Liege & Ally), Lyra Vaelen (Quartermaster & Friend), High Inquisitor Malakor (Nemesis).',
      relatedLocations: 'Sunspire Citadel, Shattered Caldera',
      relatedOrganizations: 'House Vance, Iron Covenant'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-sunspire', 'art-iron-covenant', 'art-obsidian-synod', 'art-malakor', 'art-lyra'],
    galleryCaptions: ['Kaelen aboard the flagship Sovereign Wing'],
    versions: [
      { id: 'v-k1', timestamp: '2026-11-10 09:15', author: 'Elena Rostova', note: 'Canonical combat profile finalized', contentSnapshot: 'Lord Commander Kaelen Thorne profile.' }
    ],
    comments: [],
    wordCount: 285,
    updatedAt: '2026-11-10 09:15'
  },
  {
    id: 'art-lyra',
    worldId: 'world-aethelgard',
    title: 'Chief Artificer Lyra Vaelen',
    aliases: ['Lyra Vaelen', 'Lyra', 'Master Vaelen'],
    templateType: 'Character',
    category: 'Characters',
    tags: ['Artificer', 'Scholar', 'Aether-Tech'],
    summary: 'Head of the Resonant Foundry at Sunspire Citadel and architect of the twin-core skyship condensers.',
    content: `Chief Artificer Lyra Vaelen leads the Guild of Harmonic Engineers within Sunspire Citadel. Having studied ancient pre-Sundering schematics recovered from the Shattered Caldera, she discovered that the Astral Scepter of Solis is actually a tuning key for a planetary stabilization array.

She collaborates closely with Empress Seraphina Vance and supplies Lord Commander Kaelen Thorne with experimental Aether-shielded hulls.`,
    secretNotes: 'Lyra is secretly building a miniature resonance beacon capable of locating Archon Valerius Vance.',
    spoilerWarning: '',
    templateValues: {
      fullName: 'Lyra Corinne Vaelen',
      alias: 'The Spark of Vaelis',
      age: '28',
      gender: 'Female (she/her)',
      species: 'Solarian Human',
      occupation: 'Chief Imperial Artificer',
      motivation: 'Decode the pre-Sundering planetary grid to provide free, stable energy to all settlements.',
      personality: 'Rapid-fire speaker, ink-stained, endlessly curious.',
      relatedLocations: 'Sunspire Citadel',
      relatedOrganizations: 'House Vance'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-kaelen', 'art-sunspire', 'art-scepter', 'art-caldera'],
    galleryCaptions: ['Lyra calibrating a harmonic condenser'],
    versions: [],
    comments: [],
    wordCount: 198,
    updatedAt: '2026-11-11 16:40'
  },
  {
    id: 'art-malakor',
    worldId: 'world-aethelgard',
    title: 'High Inquisitor Malakor',
    aliases: ['Malakor', 'Inquisitor Malakor', 'The Ash Prophet'],
    templateType: 'Character',
    category: 'Characters',
    tags: ['Antagonist', 'Obsidian Synod', 'Hierophant'],
    summary: 'Supreme hierophant of the Obsidian Synod who seeks to trigger a controlled Second Sundering during the Eclipse of Twin Moons.',
    content: `High Inquisitor Malakor presides over the subterranean basilicas of the Obsidian Synod near the rim of the Shattered Caldera. Convinced that mortal empires are parasitic upon the world's Aether veins, Malakor preaches that only a total purge of the sky-citadels—starting with Sunspire Citadel—can restore primordial equilibrium.

His agents have infiltrated the trade convoys of the Iron Covenant and repeatedly clashed with Lord Commander Kaelen Thorne.`,
    secretNotes: 'Malakor was once Archon Valerius Vance’s chief astrological advisor before the disastrous 401 SR expedition.',
    spoilerWarning: 'Major antagonist motive details.',
    templateValues: {
      fullName: 'Malakor of the Seventh Cinder',
      alias: 'The Ash Prophet',
      age: '64',
      gender: 'Male (he/him)',
      species: 'Solarian Human (Aether-scarred)',
      occupation: 'High Inquisitor of the Obsidian Synod',
      motivation: 'Reclaim all refined Aether cores and return them to the Shattered Caldera.',
      relatedLocations: 'Shattered Caldera',
      relatedOrganizations: 'Obsidian Synod'
    },
    status: 'published',
    visibility: 'private',
    linkedEntityIds: ['art-obsidian-synod', 'art-caldera', 'art-sunspire', 'art-kaelen', 'art-seraphina'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 210,
    updatedAt: '2026-11-09 12:00'
  },
  {
    id: 'art-sunspire',
    worldId: 'world-aethelgard',
    title: 'Sunspire Citadel',
    aliases: ['Sunspire', 'The Alabaster Eyrie'],
    templateType: 'Location - Settlement',
    category: 'Locations',
    tags: ['Capital', 'Sky-City', 'Fortress'],
    summary: 'Tiered capital metropolis anchored atop a levitating basalt monolith three thousand feet above the Sea of Glass.',
    content: `Sunspire Citadel serves as the seat of House Vance and the foremost sky-port in the northern hemisphere. Held aloft by three colossal pre-Sundering Aether pilings, the city is divided into three concentric rings: the Foundry Terrene, the Scholars' Promenade, and the Alabaster Crown where Empress Seraphina Vance holds court.

Fourteen sky-bridges extend from its outer bastion, patrolled day and night by the airships of Lord Commander Kaelen Thorne and maintained by Chief Artificer Lyra Vaelen.`,
    secretNotes: 'The third Aether piling beneath the lower cistern is operating at 41% resonance capacity.',
    spoilerWarning: '',
    templateValues: {
      settlementType: 'Metropolis',
      population: 185000,
      government: 'Empress Seraphina Vance & The Senate of Guilds',
      economy: 'Refined Aether condensers, precision chronometers, sky-ship hulls, and archival scholarship.',
      defenses: 'Triple harmonic ward domes, 24 sky-skiff squadrons, and rotarylightning batteries.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-kaelen', 'art-lyra', 'art-house-vance'],
    galleryCaptions: ['Sunspire Citadel at dawn above the cloud deck'],
    versions: [],
    comments: [],
    wordCount: 245,
    updatedAt: '2026-11-12 18:00'
  },
  {
    id: 'art-caldera',
    worldId: 'world-aethelgard',
    title: 'Shattered Caldera',
    aliases: ['The Caldera', 'Crater of First Glass'],
    templateType: 'Location - Geographic',
    category: 'Locations',
    tags: ['Anomaly', 'HazardZone', 'Ruins'],
    summary: 'A hundred-mile-wide gravitational and arcane rift where the First Crown fractured four centuries ago.',
    content: `The Shattered Caldera is the epicenter of the Sundering of 0 SR. Within its terraced obsidian ring, gravity fluctuates with the lunar tide, causing monolithic shards of basalt and vitrified ruins to drift in slow, lethal orbits.

Despite the lethal Aether storms, prospectors from the Iron Covenant and zealots of the Obsidian Synod under High Inquisitor Malakor risk the descent to harvest raw Star-Fallen Orichalcum.`,
    secretNotes: 'At the center of the Caldera lies the intact Spire of Zero, where Archon Valerius Vance is suspended in temporal stasis.',
    spoilerWarning: '',
    templateValues: {
      biome: 'Vitrified Volcanic Rift & Gravitational Anomaly',
      resources: 'Raw Resonant Aether crystals, Star-Fallen Orichalcum, pre-Sundering relics.',
      hazards: 'Temporal shear pockets, silica-glass squalls, and rogue gravity inversions.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-malakor', 'art-obsidian-synod', 'art-iron-covenant'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 204,
    updatedAt: '2026-11-08 11:30'
  },
  {
    id: 'art-house-vance',
    worldId: 'world-aethelgard',
    title: 'House Vance',
    aliases: ['Dynasty of the Dawn', 'Imperial House Vance'],
    templateType: 'Organization',
    category: 'Organizations',
    tags: ['Royal House', 'Faction', 'Sunspire'],
    summary: 'Sovereign dynasty of Sunspire Citadel, historically sworn to preserve the planetary Aether anchors.',
    content: `Founded in the immediate aftermath of the Sundering by First Archon Aurelia Vance, House Vance transformed Sunspire Citadel from a refugee sky-fortress into a center of learning and trade. Currently led by Empress Seraphina Vance, the house faces internal pressure from conservative dukes and external hostility from the Obsidian Synod.`,
    secretNotes: '',
    spoilerWarning: '',
    templateValues: {
      orgType: 'Noble House',
      motto: 'Through Storm, The Unbroken Spire',
      leader: 'Empress Seraphina Vance',
      headquarters: 'Sunspire Citadel',
      agenda: 'Maintain sky-lane open trade and stabilize the failing planetary Aether grid.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-sunspire', 'art-kaelen'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 165,
    updatedAt: '2026-11-07 15:20'
  },
  {
    id: 'art-iron-covenant',
    worldId: 'world-aethelgard',
    title: 'Iron Covenant',
    aliases: ['The Foundry Lords', 'Covenant of Iron'],
    templateType: 'Organization',
    category: 'Organizations',
    tags: ['Industrial', 'Guild Coalition', 'Military'],
    summary: 'Confederation of heavily fortified mountain foundries and airship shipyards controlling sixty percent of refined sky-steel.',
    content: `The Iron Covenant governs the smoking basalt peaks of the Northern Rim. Governed by a council of seven Master Ironwrights, they supply armor and engines to Sunspire Citadel in exchange for agricultural imports, though old grievances over the defection of Lord Commander Kaelen Thorne still strain diplomatic summits.`,
    secretNotes: 'Two of the seven Master Ironwrights have secretly accepted bribes of raw Orichalcum from the Obsidian Synod.',
    spoilerWarning: '',
    templateValues: {
      orgType: 'Mercenary Guild',
      motto: 'Hammer, Anvil, Sovereignty',
      leader: 'Grand Ironwright Torren',
      headquarters: 'Krag-Vahl Foundry',
      agenda: 'Monopoly over sky-ship hull production and mining concessions in the Shattered Caldera.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-kaelen', 'art-sunspire', 'art-caldera'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 176,
    updatedAt: '2026-11-06 09:40'
  },
  {
    id: 'art-obsidian-synod',
    worldId: 'world-aethelgard',
    title: 'Obsidian Synod',
    aliases: ['The Synod', 'Children of the Caldera'],
    templateType: 'Organization',
    category: 'Organizations',
    tags: ['Cult', 'Antagonist Faction', 'Arcane'],
    summary: 'Ascetic apocalyptic order operating from the rim of the Shattered Caldera.',
    content: `Led by High Inquisitor Malakor, the Obsidian Synod believes that harvesting Aether to levitate cities like Sunspire Citadel is an existential transgression that will tear reality apart. Their Choir-Inquisitors wield sound-dampening bells that disrupt skyship condensers.`,
    secretNotes: '',
    spoilerWarning: '',
    templateValues: {
      orgType: 'Religious Sect',
      motto: 'All Rises Must Return to Ash',
      leader: 'High Inquisitor Malakor',
      headquarters: 'Shattered Caldera',
      agenda: 'Sabotage the three planetary Aether pilings during the Eclipse of Twin Moons.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-malakor', 'art-caldera', 'art-sunspire'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 158,
    updatedAt: '2026-11-05 14:10'
  },
  {
    id: 'art-scepter',
    worldId: 'world-aethelgard',
    title: 'Astral Scepter of Solis',
    aliases: ['Scepter of Solis', 'The First Tuning Rod'],
    templateType: 'Item',
    category: 'Items',
    tags: ['Artifact', 'Regalia', 'Aether-Tech'],
    summary: 'Pre-Sundering harmonic keystone disguised as the imperial regalia of House Vance.',
    content: `Wrought from white Star-Fallen Orichalcum and housing a counter-rotating gyroscope of pure diamond aether-glass, the Astral Scepter of Solis is borne by Empress Seraphina Vance. According to Chief Artificer Lyra Vaelen, its true purpose is to synchronize the frequency of the planetary ley-anchors.`,
    secretNotes: 'Requires the blood-resonance of two Vance heirs simultaneously to unlock its planetary broadcast mode.',
    spoilerWarning: '',
    templateValues: {
      rarity: 'Unique Artifact',
      creator: 'First Archon Aurelia Vance',
      properties: 'Stabilizes Aether storms within 10 leagues; projects the Solaris Harmonic Ward.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-lyra', 'art-house-vance'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 152,
    updatedAt: '2026-11-04 20:00'
  },
  {
    id: 'art-siege-ashfall',
    worldId: 'world-aethelgard',
    title: 'Siege of Ashfall',
    aliases: ['Battle of Ashfall', 'The Red Winter Siege'],
    templateType: 'Conflict',
    category: 'History & Lore',
    tags: ['War', 'Historical Battle', '402 SR'],
    summary: 'Decisive twelve-day aerial siege in 402 SR where Kaelen Thorne saved the outer rings of Sunspire Citadel.',
    content: `Fought in the freezing gale of 402 SR, the Siege of Ashfall began when rogue dreadnoughts funded by the Obsidian Synod attempted to ram the western Aether piling of Sunspire Citadel. A young Kaelen Thorne rallied the Third Sky-Lancers, executing a vertical dive through the ash clouds to board the flagship.`,
    secretNotes: '',
    spoilerWarning: '',
    templateValues: {
      dateRange: 'Year 402 SR, Month of Frost, Days 4–16',
      belligerents: 'Sunspire Citadel vs Obsidian Synod Dreadnought Flotilla',
      aftermath: 'Destruction of the Synod aerial fleet; Kaelen Thorne promoted to Lord Commander.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-kaelen', 'art-sunspire', 'art-obsidian-synod'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 160,
    updatedAt: '2026-11-03 17:45'
  },
  {
    id: 'art-harmonic-ward',
    worldId: 'world-aethelgard',
    title: 'Canticle of the Harmonic Ward',
    aliases: ['Harmonic Ward', 'Solaris Ward'],
    templateType: 'Spell',
    category: 'Arcana & Systems',
    tags: ['Abjuration', 'Resonance', 'High-Circle'],
    summary: 'Fifth-circle acoustic resonance invocation that locks atmospheric Aether into a refractive crystalline lattice.',
    content: `Developed in the Athenaeum of Sunspire Citadel and amplified via the Astral Scepter of Solis, the Canticle of the Harmonic Ward transforms ambient Aether particles into a hexagonal barrier capable of deflecting artillery shells and pyroclastic ash.`,
    secretNotes: '',
    spoilerWarning: '',
    templateValues: {
      circleTier: '5th Resonance Circle',
      cost: 'One refined Aether prism + sustained vocal or tuning-fork pitch',
      manifestation: 'Amber geometric lattice humming at 432 Hz across the sky.'
    },
    status: 'published',
    visibility: 'public',
    linkedEntityIds: ['art-seraphina', 'art-scepter', 'art-sunspire'],
    galleryCaptions: [],
    versions: [],
    comments: [],
    wordCount: 145,
    updatedAt: '2026-11-02 12:30'
  }
];

export const INITIAL_RELATIONSHIPS: EntityRelationship[] = [
  {
    id: 'rel-1',
    worldId: 'world-aethelgard',
    category: 'Character Relationship',
    sourceArticleId: 'art-seraphina',
    targetArticleId: 'art-kaelen',
    relationType: 'Sworn Shield & Strategic Partner',
    score: 92,
    description: 'Unbreakable mutual trust forged after the 409 SR succession crisis.',
    bidirectional: true
  },
  {
    id: 'rel-2',
    worldId: 'world-aethelgard',
    category: 'Character Relationship',
    sourceArticleId: 'art-seraphina',
    targetArticleId: 'art-lyra',
    relationType: 'Patron & Chief Artificer',
    score: 88,
    description: 'Co-architects of the Aether Grid stabilization initiative.',
    bidirectional: true
  },
  {
    id: 'rel-3',
    worldId: 'world-aethelgard',
    category: 'Character Relationship',
    sourceArticleId: 'art-kaelen',
    targetArticleId: 'art-malakor',
    relationType: 'Bitter Nemesis',
    score: -95,
    description: 'Sworn enemies since Kaelen’s captivity prior to the Siege of Ashfall.',
    bidirectional: true
  },
  {
    id: 'rel-4',
    worldId: 'world-aethelgard',
    category: 'Character Relationship',
    sourceArticleId: 'art-seraphina',
    targetArticleId: 'art-malakor',
    relationType: 'Ideological Adversary',
    score: -90,
    description: 'Competing visions for the fate of the planetary Aether pilings.',
    bidirectional: true
  },
  {
    id: 'rel-5',
    worldId: 'world-aethelgard',
    category: 'Diplomacy Web',
    sourceArticleId: 'art-house-vance',
    targetArticleId: 'art-iron-covenant',
    relationType: 'Trade & Defense Treaty',
    score: 54,
    description: 'Vital grain-for-skysteel trade pact, strained by tariff disputes.',
    bidirectional: true
  },
  {
    id: 'rel-6',
    worldId: 'world-aethelgard',
    category: 'Diplomacy Web',
    sourceArticleId: 'art-house-vance',
    targetArticleId: 'art-obsidian-synod',
    relationType: 'Open Hostility / Cold War',
    score: -92,
    description: 'Active espionage and border skirmishes along the Caldera rim.',
    bidirectional: true
  },
  {
    id: 'rel-7',
    worldId: 'world-aethelgard',
    category: 'Diplomacy Web',
    sourceArticleId: 'art-iron-covenant',
    targetArticleId: 'art-obsidian-synod',
    relationType: 'Clandestine Contraband Smuggling',
    score: -25,
    description: 'Official embargo, though rogue Ironwrights trade supplies for raw Orichalcum.',
    bidirectional: true
  },
  {
    id: 'rel-8',
    worldId: 'world-aethelgard',
    category: 'Family Tree',
    sourceArticleId: 'art-house-vance',
    targetArticleId: 'art-seraphina',
    relationType: '7th Generation Sovereign Bloodline',
    generation: 3,
    description: 'Direct descendant of First Archon Aurelia Vance through Archon Valerius.',
    bidirectional: false
  },
  {
    id: 'rel-9',
    worldId: 'world-aethelgard',
    category: 'Content Tree',
    sourceArticleId: 'art-sunspire',
    targetArticleId: 'art-scepter',
    relationType: 'Houses Primary Keystone',
    description: 'The Scepter regulates the central Aether piling of Sunspire Citadel.',
    bidirectional: false
  },
  {
    id: 'rel-10',
    worldId: 'world-aethelgard',
    category: 'Content Tree',
    sourceArticleId: 'art-scepter',
    targetArticleId: 'art-harmonic-ward',
    relationType: 'Amplifies Resonance Spell',
    description: 'Required focus for projecting city-scale Harmonic Wards.',
    bidirectional: false
  }
];

export const INITIAL_MAPS: WorldMap[] = [
  {
    id: 'map-aethelgard-world',
    worldId: 'world-aethelgard',
    name: 'Aethelgard Sky-Archipelago (World Scale)',
    scaleLevel: 'World',
    description: 'Primary cartographic projection of the Northern Sky-Archipelago, the Sea of Glass, and the Shattered Caldera.',
    svgTheme: 'archipelago',
    layers: [
      { id: 'lay-terrain', name: 'Terrain & Sky-Islands', visible: true, category: 'Terrain' },
      { id: 'lay-political', name: 'Sovereign Borders & Zones', visible: true, category: 'Political' },
      { id: 'lay-trade', name: 'Aether Sky-Lanes & Trade Routes', visible: true, category: 'Trade Routes' },
      { id: 'lay-tracks', name: 'Kaelen’s 418 SR Patrol Track', visible: true, category: 'Character Tracks' },
      { id: 'lay-historical', name: 'Pre-Sundering 0 SR Coastline', visible: false, category: 'Historical' },
      { id: 'lay-secret', name: 'Secret GM Synod Infiltration Nodes', visible: true, category: 'Secret GM' }
    ],
    markers: [
      {
        id: 'mk-sunspire',
        mapId: 'map-aethelgard-world',
        label: 'Sunspire Citadel',
        type: 'Location',
        layerId: 'lay-political',
        x: 34,
        y: 38,
        description: 'Capital sky-metropolis of House Vance (Pop. 185,000). Click "Drill Into Child Map" to view the Citadel District Map.',
        linkedArticleId: 'art-sunspire',
        childMapId: 'map-sunspire-city',
        isHiddenGM: false,
        eraTag: 'Current (418 SR)'
      },
      {
        id: 'mk-caldera',
        mapId: 'map-aethelgard-world',
        label: 'Shattered Caldera',
        type: 'Location',
        layerId: 'lay-terrain',
        x: 68,
        y: 62,
        description: 'Gravitational anomaly and crater of the First Sundering.',
        linkedArticleId: 'art-caldera',
        isHiddenGM: false,
        eraTag: '0 SR – Present'
      },
      {
        id: 'mk-iron-foundry',
        mapId: 'map-aethelgard-world',
        label: 'Krag-Vahl Foundry (Iron Covenant)',
        type: 'Location',
        layerId: 'lay-political',
        x: 24,
        y: 20,
        description: 'Primary sky-ship shipyard of the Iron Covenant in the Northern Rim.',
        linkedArticleId: 'art-iron-covenant',
        isHiddenGM: false
      },
      {
        id: 'mk-ashfall-site',
        mapId: 'map-aethelgard-world',
        label: 'Battlefield of Ashfall (402 SR)',
        type: 'Event',
        layerId: 'lay-political',
        x: 45,
        y: 46,
        description: 'Aerial engagement coordinates where Kaelen Thorne broke the Synod armada.',
        linkedArticleId: 'art-siege-ashfall',
        isHiddenGM: false
      },
      {
        id: 'mk-kaelen-flagship',
        mapId: 'map-aethelgard-world',
        label: 'Flagship "Sovereign Wing" (Kaelen)',
        type: 'Character',
        layerId: 'lay-tracks',
        x: 51,
        y: 50,
        description: 'Current patrol position of Lord Commander Kaelen Thorne along the Caldera watch-line.',
        linkedArticleId: 'art-kaelen',
        isHiddenGM: false,
        pathCoords: [
          { x: 34, y: 38 },
          { x: 42, y: 43 },
          { x: 51, y: 50 },
          { x: 61, y: 56 }
        ]
      },
      {
        id: 'mk-synod-vault',
        mapId: 'map-aethelgard-world',
        label: 'Hidden Synod Basilisk Vault',
        type: 'Custom',
        layerId: 'lay-secret',
        x: 73,
        y: 55,
        description: 'GM ONLY: Subterranean resonance cannon being assembled by High Inquisitor Malakor.',
        linkedArticleId: 'art-malakor',
        isHiddenGM: true
      }
    ]
  },
  {
    id: 'map-sunspire-city',
    worldId: 'world-aethelgard',
    parentMapId: 'map-aethelgard-world',
    name: 'Sunspire Citadel — Concentric Rings (City Scale)',
    scaleLevel: 'City',
    description: 'Nested urban plan of Sunspire Citadel showing the Alabaster Dais, Resonant Foundry, and Sky-Docks.',
    svgTheme: 'citadel',
    layers: [
      { id: 'lay-city-wards', name: 'Citadel Wards & Rings', visible: true, category: 'Political' },
      { id: 'lay-city-secret', name: 'Under-Cistern Tunnels (GM)', visible: true, category: 'Secret GM' }
    ],
    markers: [
      {
        id: 'mk-alabaster-dais',
        mapId: 'map-sunspire-city',
        label: 'The Alabaster Dais (Imperial Palace)',
        type: 'Location',
        layerId: 'lay-city-wards',
        x: 50,
        y: 48,
        description: 'Throne hall of Empress Seraphina Vance and vault of the Astral Scepter of Solis.',
        linkedArticleId: 'art-seraphina',
        isHiddenGM: false
      },
      {
        id: 'mk-resonant-foundry',
        mapId: 'map-sunspire-city',
        label: 'Resonant Foundry & Athenaeum',
        type: 'Location',
        layerId: 'lay-city-wards',
        x: 35,
        y: 62,
        description: 'Laboratory of Chief Artificer Lyra Vaelen.',
        linkedArticleId: 'art-lyra',
        isHiddenGM: false
      },
      {
        id: 'mk-skywatch-bastion',
        mapId: 'map-sunspire-city',
        label: 'Skywatch Perimeter Bastion',
        type: 'Location',
        layerId: 'lay-city-wards',
        x: 68,
        y: 32,
        description: 'Garrison headquarters of Lord Commander Kaelen Thorne.',
        linkedArticleId: 'art-kaelen',
        isHiddenGM: false
      }
    ]
  }
];

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-sundering',
    worldId: 'world-aethelgard',
    timelineId: 'tl-main',
    title: 'The Sundering of the First Crown',
    year: 0,
    monthIndex: 0,
    day: 1,
    durationDays: 7,
    era: 'First Reckoning',
    lane: 'Planetary History',
    summary: 'Over-harmonization of the Prime Aether Well fractures the central continent, creating the Shattered Caldera and lifting the sky-monoliths.',
    linkedArticleIds: ['art-caldera', 'art-house-vance', 'art-scepter'],
    linkedMapId: 'map-aethelgard-world',
    linkedMarkerId: 'mk-caldera',
    significance: 'Cataclysm'
  },
  {
    id: 'evt-ashfall',
    worldId: 'world-aethelgard',
    timelineId: 'tl-main',
    title: 'The Siege of Ashfall',
    year: 402,
    monthIndex: 5,
    day: 4,
    durationDays: 12,
    era: 'Fourth Century SR',
    lane: 'Military & Conflicts',
    summary: 'Kaelen Thorne leads the Third Sky-Lancers through a volcanic ash gale to repel the Obsidian Synod dreadnought armada.',
    linkedArticleIds: ['art-siege-ashfall', 'art-kaelen', 'art-sunspire', 'art-obsidian-synod'],
    linkedMapId: 'map-aethelgard-world',
    linkedMarkerId: 'mk-ashfall-site',
    significance: 'Conflict'
  },
  {
    id: 'evt-coronation',
    worldId: 'world-aethelgard',
    timelineId: 'tl-main',
    title: 'Coronation of Empress Seraphina Vance',
    year: 409,
    monthIndex: 1,
    day: 19,
    durationDays: 1,
    era: 'Fourth Century SR',
    lane: 'Imperial Politics',
    summary: 'Following Archon Valerius Vance’s disappearance near the Caldera, Seraphina takes the Alabaster Dais and opens the Free Sky-Lanes.',
    linkedArticleIds: ['art-seraphina', 'art-sunspire', 'art-house-vance'],
    linkedMapId: 'map-aethelgard-world',
    linkedMarkerId: 'mk-sunspire',
    significance: 'Milestone'
  },
  {
    id: 'evt-covenant-summit',
    worldId: 'world-aethelgard',
    timelineId: 'tl-main',
    title: 'The Krag-Vahl Sky-Steel Accord',
    year: 416,
    monthIndex: 3,
    day: 10,
    durationDays: 5,
    era: 'Fourth Century SR',
    lane: 'Imperial Politics',
    summary: 'Empress Seraphina and Chief Artificer Lyra Vaelen negotiate condenser technology sharing with the Iron Covenant.',
    linkedArticleIds: ['art-seraphina', 'art-lyra', 'art-iron-covenant'],
    linkedMapId: 'map-aethelgard-world',
    linkedMarkerId: 'mk-iron-foundry',
    significance: 'Cultural'
  },
  {
    id: 'evt-eclipse-prophecy',
    worldId: 'world-aethelgard',
    timelineId: 'tl-main',
    title: 'Convergence of the Twin Moons (Act II Climax)',
    year: 418,
    monthIndex: 2,
    day: 14,
    durationDays: 3,
    era: 'Current Era (418 SR)',
    lane: 'Planetary History',
    summary: 'Solis-Minor and Noctis align directly above the Shattered Caldera while High Inquisitor Malakor activates the subterranean resonance array.',
    linkedArticleIds: ['art-malakor', 'art-obsidian-synod', 'art-caldera', 'art-scepter'],
    linkedMapId: 'map-aethelgard-world',
    linkedMarkerId: 'mk-synod-vault',
    significance: 'Major'
  }
];

export const INITIAL_CALENDAR: CustomCalendar = {
  id: 'cal-solarian',
  worldId: 'world-aethelgard',
  name: 'Solarian Reckoning (SR)',
  yearZeroLabel: 'After the Sundering of the First Crown',
  currentYear: 418,
  weekdays: ['Solday', 'Aetherday', 'Vanceday', 'Forgewake', 'Galeday', 'Starveil'],
  months: [
    { name: 'Dawnwake', days: 30, season: 'High Spring' },
    { name: 'Aurelia', days: 30, season: 'Early Summer' },
    { name: 'Solstice Crown', days: 31, season: 'High Summer' },
    { name: 'Emberfall', days: 30, season: 'Autumn' },
    { name: 'Glasswind', days: 30, season: 'Late Autumn' },
    { name: 'Frostveil', days: 29, season: 'Deep Winter' }
  ],
  moons: [
    { name: 'Solis-Minor', cycleDays: 18, color: '#f59e0b' },
    { name: 'Noctis-Vael', cycleDays: 36, color: '#38bdf8' },
    { name: 'Cinder-Fragment', cycleDays: 9, color: '#f43f5e' }
  ],
  festivals: [
    { name: 'Day of Unbroken Spires', monthIndex: 0, day: 1, description: 'New Year remembrance of the lifting of Sunspire Citadel.' },
    { name: 'Festival of Lanterns & Leys', monthIndex: 1, day: 19, description: 'Celebration of Empress Seraphina’s open sky-dock charter.' },
    { name: 'Eclipse of Twin Moons', monthIndex: 2, day: 14, description: 'Rare celestial alignment amplifying all Resonant Aether.' },
    { name: 'Ashfall Vigil', monthIndex: 5, day: 4, description: 'Torchlight tribute to the defenders of the 402 SR siege.' }
  ]
};

export const INITIAL_WHITEBOARDS: WhiteboardBoard[] = [
  {
    id: 'wb-act2-conspiracy',
    worldId: 'world-aethelgard',
    name: 'Act II: Caldera Eclipse & Piling Conspiracy',
    category: 'Plot Diagram',
    freehandPaths: [],
    nodes: [
      {
        id: 'wn-1',
        boardId: 'wb-act2-conspiracy',
        type: 'entity',
        title: 'Empress Seraphina Vance',
        content: 'Needs the third keystone before Month 3 Day 14 to stabilize Piling #3.',
        x: 60,
        y: 70,
        width: 230,
        height: 115,
        color: 'amber',
        linkedEntityId: 'art-seraphina',
        layer: 'Protagonists'
      },
      {
        id: 'wn-2',
        boardId: 'wb-act2-conspiracy',
        type: 'entity',
        title: 'Astral Scepter of Solis',
        content: 'Lyra discovered it broadcasts a planetary stabilization wave at 432 Hz.',
        x: 370,
        y: 65,
        width: 230,
        height: 115,
        color: 'sky',
        linkedEntityId: 'art-scepter',
        layer: 'Artifacts'
      },
      {
        id: 'wn-3',
        boardId: 'wb-act2-conspiracy',
        type: 'entity',
        title: 'High Inquisitor Malakor',
        content: 'Assembling the Basilisk Resonance Cannon on the eastern Caldera rim.',
        x: 680,
        y: 75,
        width: 230,
        height: 115,
        color: 'rose',
        linkedEntityId: 'art-malakor',
        layer: 'Antagonists'
      },
      {
        id: 'wn-4',
        boardId: 'wb-act2-conspiracy',
        type: 'sticky',
        title: 'Plot Twist: The Missing Archon',
        content: 'Valerius Vance isn’t dead—he is inside the Spire of Zero holding back the rift manually.',
        x: 370,
        y: 245,
        width: 240,
        height: 120,
        color: 'emerald',
        layer: 'Secrets'
      },
      {
        id: 'wn-5',
        boardId: 'wb-act2-conspiracy',
        type: 'map',
        title: 'Shattered Caldera Landing Zone',
        content: 'Kaelen’s flagship Sovereign Wing must enter via the low-gravity southern trench.',
        x: 60,
        y: 245,
        width: 235,
        height: 120,
        color: 'slate',
        linkedEntityId: 'art-caldera',
        layer: 'Locations'
      }
    ],
    edges: [
      { id: 'we-1', boardId: 'wb-act2-conspiracy', fromNodeId: 'wn-1', toNodeId: 'wn-2', label: 'Wields Keystone' },
      { id: 'we-2', boardId: 'wb-act2-conspiracy', fromNodeId: 'wn-2', toNodeId: 'wn-3', label: 'Counter-Frequency' },
      { id: 'we-3', boardId: 'wb-act2-conspiracy', fromNodeId: 'wn-5', toNodeId: 'wn-4', label: 'Expedition Target' }
    ]
  }
];

export const INITIAL_MANUSCRIPTS: Manuscript[] = [
  {
    id: 'ms-crown-of-glass',
    worldId: 'world-aethelgard',
    title: 'Book I: The Crown of Glass & Thunder',
    genre: 'Epic Aetherpunk Fantasy',
    synopsis: 'As the Twin Moons approach conjunction, Empress Seraphina Vance, Commander Kaelen Thorne, and Chief Artificer Lyra Vaelen race to prevent the Obsidian Synod from collapsing Sunspire Citadel.',
    targetWords: 85000,
    theme: 'editorial',
    updatedAt: '2026-11-13 15:00',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: The Alabaster Fault',
        synopsis: 'Tremors in the third Aether piling force an emergency midnight council in Sunspire Citadel.',
        scenes: [
          {
            id: 'sc-101',
            title: 'Scene 1.1: Harmonics in the Cistern',
            synopsis: 'Lyra Vaelen measures a dangerous resonance drop beneath the lower ring.',
            povCharacterId: 'art-lyra',
            locationArticleId: 'art-sunspire',
            status: 'Final',
            notes: 'Highlight the brass astrolabe motifs and the 432 Hz hum of the pilings.',
            wordCount: 245,
            content: `Three hundred feet beneath the Scholars' Promenade of Sunspire Citadel, the third Aether piling sang a fractured note.

Chief Artificer Lyra Vaelen pressed her brass acoustic stethoscope against the frosted basalt casing. Instead of the steady, resonant C-sharp that had held the metropolis aloft since the reign of First Archon Aurelia, the crystal core fluttered with a jagged sub-harmonic tremor.

"Forty-one percent capacity," Lyra whispered, wiping condenser oil from her spectacles. Beside her, the bronze filigree of the pressure gauges shivered as a cargo dreadnought from the Iron Covenant docked at the upper sky-piers. "If the Obsidian Synod disrupts the outer relay during the Eclipse of Twin Moons, the entire western ward will drop into the Sea of Glass."

She unrolled her leather satchel, checking the telemetry cipher meant for Empress Seraphina Vance alone. Above the vaulted ceiling, the boots of Lord Commander Kaelen Thorne's Sky-Vanguard echoed along the iron catwalk.`
          },
          {
            id: 'sc-102',
            title: 'Scene 1.2: Council at the Alabaster Dais',
            synopsis: 'Seraphina and Kaelen interrogate a captured Synod courier carrying Orichalcum chimes.',
            povCharacterId: 'art-seraphina',
            locationArticleId: 'art-sunspire',
            status: 'Revised',
            notes: 'Foreshadow High Inquisitor Malakor’s resonance cannon in the Shattered Caldera.',
            wordCount: 218,
            content: `Dawn broke over the cloud sea in ribbons of copper and violet, illuminating the tall lancet windows of the Alabaster Dais.

Empress Seraphina Vance rested her scarred right hand upon the Astral Scepter of Solis. Across the inlaid marble map table stood Lord Commander Kaelen Thorne, his storm-leather brigandine still dusted with high-altitude rime from his night patrol aboard the Sovereign Wing.

"The courier was intercepted six leagues north of the Shattered Caldera," Kaelen said, setting a hollow cylinder of Star-Fallen Orichalcum onto the table. "Forged in an Iron Covenant kiln, yet inscribed with the liturgical ciphers of High Inquisitor Malakor."

Seraphina studied the runic grooves. "Then the embargo is leaking. Prepare the flagship, Kaelen. We are not waiting for the Eclipse to reach Sunspire—we take the Scepter directly to the Caldera rim."`
          }
        ]
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Descent into First Glass',
        synopsis: 'The flagship Sovereign Wing enters the gravitational anomalies of the Shattered Caldera.',
        scenes: [
          {
            id: 'sc-201',
            title: 'Scene 2.1: Through the Silica Squall',
            synopsis: 'Kaelen navigates inverted gravity pockets while Synod bells ring from the crater walls.',
            povCharacterId: 'art-kaelen',
            locationArticleId: 'art-caldera',
            status: 'Drafting',
            notes: 'Use sensory details from the Shattered Caldera geographic template.',
            wordCount: 164,
            content: `At the boundary of the Shattered Caldera, the compass needles aboard the Sovereign Wing spun wild and useless.

Kaelen Thorne gripped the brass elevation wheel as a monolith of vitrified basalt drifted upward past the starboard bow, trailing ribbons of luminous violet dust. Below them, the Crater of First Glass yawned like a broken astrolabe.

"Activate the Canticle of the Harmonic Ward!" Kaelen barked to the deck choir. As the amber geometric lattice flared around the hull, the first acoustic volley from the Obsidian Synod's rim batteries struck the shield with the roar of a breaking glacier.`
          }
        ]
      }
    ]
  }
];

export const INITIAL_NOTES: NotebookNote[] = [
  {
    id: 'note-1',
    worldId: 'world-aethelgard',
    scope: 'Project',
    title: 'Aether Resonance Rules & Hard Limits',
    category: 'System Design',
    color: 'amber',
    tags: ['Magic System', 'Canon Rule'],
    content: 'Rule 1: Aether cannot create matter from nothing; it only stores kinetic, thermal, or acoustic potential.\nRule 2: Prolonged unshielded contact causes luminous iris rings and nerve calcification (see {{empire_name}} medical archives).',
    updatedAt: '2026-11-13 11:20'
  },
  {
    id: 'note-2',
    worldId: 'world-aethelgard',
    scope: 'Personal',
    title: 'Act III Dialogue Beats — Seraphina & Valerius',
    category: 'Story Ideas',
    color: 'sky',
    tags: ['Dialogue', 'Book I'],
    content: 'When Seraphina reaches the Spire of Zero, Valerius should not recognize how much time has passed since 409 SR. To him, only three hours have elapsed.',
    updatedAt: '2026-11-12 21:05'
  },
  {
    id: 'note-3',
    worldId: 'world-aethelgard',
    scope: 'Project',
    title: 'Conlang Phonology: High Solarian vs Dockside Cant',
    category: 'Linguistics',
    color: 'emerald',
    tags: ['Language', 'Naming'],
    content: 'High Solarian uses Latinate/Ionic vowel endings (-ia, -ius, -ael). Iron Covenant names use harsh plosive compounds (Krag-Vahl, Torren,Voss).',
    updatedAt: '2026-11-11 08:50'
  }
];

export const INITIAL_TASKS: ProjectTask[] = [
  {
    id: 'tsk-1',
    worldId: 'world-aethelgard',
    title: 'Complete 21-field template audit for High Inquisitor Malakor',
    category: 'Lore',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Elena Rostova',
    deadline: '2026-11-18',
    linkedArticleId: 'art-malakor'
  },
  {
    id: 'tsk-2',
    worldId: 'world-aethelgard',
    title: 'Place 4 additional under-cistern markers on Sunspire City Map',
    category: 'Map',
    priority: 'Medium',
    status: 'Backlog',
    assignee: 'Marcus Vance',
    deadline: '2026-11-20',
    linkedArticleId: 'art-sunspire'
  },
  {
    id: 'tsk-3',
    worldId: 'world-aethelgard',
    title: 'Continuity review on Chapter 2 gravitational anomaly physics',
    category: 'Manuscript',
    priority: 'Critical',
    status: 'In Review',
    assignee: 'Sora Takahashi',
    deadline: '2026-11-15',
    linkedArticleId: 'art-caldera'
  },
  {
    id: 'tsk-4',
    worldId: 'world-aethelgard',
    title: 'Approve Concept Turnaround Sheet for Sky-Vanguard Halberd',
    category: 'Art & Concept',
    priority: 'High',
    status: 'Completed',
    assignee: 'Marcus Vance',
    deadline: '2026-11-12',
    linkedArticleId: 'art-kaelen'
  }
];

export const INITIAL_TABLES: InteractiveTable[] = [
  {
    id: 'tbl-skyships',
    worldId: 'world-aethelgard',
    name: 'Imperial & Covenant Skyship Hull Classifications',
    description: 'Canonical technical specifications for aerial vessels operating in 418 SR. Can be sorted, filtered, exported as CSV, or embedded in articles.',
    columns: ['Class Name', 'Faction', 'Crew', 'Max Altitude (ft)', 'Aether Core Output', 'Primary Armament'],
    rows: [
      {
        'Class Name': 'Sovereign-Wing Frigate',
        'Faction': 'Sunspire Citadel',
        'Crew': '48',
        'Max Altitude (ft)': '18500',
        'Aether Core Output': '420 MW',
        'Primary Armament': 'Twin Rotary Lightning Culverins'
      },
      {
        'Class Name': 'Kestrel Interceptor Skiff',
        'Faction': 'Sunspire Citadel',
        'Crew': '6',
        'Max Altitude (ft)': '24000',
        'Aether Core Output': '85 MW',
        'Primary Armament': 'Bow Acoustic Lance'
      },
      {
        'Class Name': 'Basalt-Bastion Dreadnought',
        'Faction': 'Iron Covenant',
        'Crew': '190',
        'Max Altitude (ft)': '12000',
        'Aether Core Output': '950 MW',
        'Primary Armament': 'Heavy Siege Mortar & Boarding Harpoons'
      },
      {
        'Class Name': 'Choir-Barge Silencer',
        'Faction': 'Obsidian Synod',
        'Crew': '64',
        'Max Altitude (ft)': '15500',
        'Aether Core Output': '310 MW',
        'Primary Armament': 'Dissonance Bell Array'
      }
    ]
  }
];

export const INITIAL_GENERATORS: RandomGenerator[] = [
  {
    id: 'gen-skyship-encounter',
    worldId: 'world-aethelgard',
    name: 'Aetherial Sky-Lane Encounter & Relic Generator',
    category: 'Worldbuilding & GM Prompt',
    description: 'Weighted probability generator for creating instant sky-island discoveries, NPC crews, and pre-Sundering relics.',
    pattern: '{Weather} near {Landmark}: {Faction} vessel carrying {Cargo}',
    pools: {
      Weather: [
        { label: 'Luminous Amber Fog', weight: 30 },
        { label: 'Silica-Glass Squall', weight: 20 },
        { label: 'Inverted Gravity Eddy', weight: 15 },
        { label: 'Crystal Clear Twin-Moonlight', weight: 35 }
      ],
      Landmark: [
        { label: 'a drifting pre-Sundering watchtower', weight: 25 },
        { label: 'the outer beacon ring of Sunspire Citadel', weight: 30 },
        { label: 'an uncharted basalt spire on the Caldera rim', weight: 25 },
        { label: 'a derelict Iron Covenant ore barge', weight: 20 }
      ],
      Faction: [
        { label: 'A damaged Sky-Vanguard patrol cutter', weight: 35 },
        { label: 'A disguised Obsidian Synod choir-sloop', weight: 25 },
        { label: 'An independent Free Sky-Mariner merchantman', weight: 40 }
      ],
      Cargo: [
        { label: 'three crates of unstable Star-Fallen Orichalcum', weight: 20 },
        { label: 'an encrypted astrolabe logbook from 401 SR', weight: 30 },
        { label: 'a defecting Ironwright engineer seeking asylum', weight: 25 },
        { label: 'a dormant harmonic tuning fork humming at 432 Hz', weight: 25 }
      ]
    },
    savedResults: [
      'Silica-Glass Squall near a drifting pre-Sundering watchtower: A disguised Obsidian Synod choir-sloop carrying an encrypted astrolabe logbook from 401 SR'
    ]
  }
];

export const INITIAL_CAMPAIGNS: RPGCampaign[] = [
  {
    id: 'cmp-caldera-vanguard',
    worldId: 'world-aethelgard',
    name: 'Shadows Over Sunspire (Tabletop Campaign)',
    systemName: 'Aetherium d20 / 5e Compatible Ruleset',
    partyLevel: 7,
    gmScreenNotes: 'GM SECRET: If the party inspects the lower cistern before Session 5, they can spot the Synod saboteur disguised as a junior artificer. Passive Perception DC 16.',
    discordWebhookUrl: 'https://discord.com/api/webhooks/example-campaign-log',
    players: [
      {
        id: 'pc-1',
        playerName: 'Dante M.',
        characterName: 'Vaelen Duskryn',
        ancestry: 'Solarian Human',
        classRole: 'Aether-Blade Vanguard (Lv 7)',
        hp: '64 / 64',
        passivePerception: 15,
        inventory: ['Resonant Halberd +1', 'Sky-Grapple Harness', '2x Aether Capacitor Vials']
      },
      {
        id: 'pc-2',
        playerName: 'Aria C.',
        characterName: 'Sister Callista',
        ancestry: 'Vaelorian Envoy',
        classRole: 'Harmonic Chorister (Lv 7)',
        hp: '51 / 51',
        passivePerception: 18,
        inventory: ['Orichalcum Tuning Fork', 'Astrolabe of Dawn', 'Diplomatic Seal of House Vance']
      },
      {
        id: 'pc-3',
        playerName: 'Sora T.',
        characterName: 'Bram Ironwright',
        ancestry: 'Northern Rim Forger',
        classRole: 'Artillerist Mechanist (Lv 7)',
        hp: '58 / 58',
        passivePerception: 14,
        inventory: ['Clockwork Drone "Spark"', 'Condensed Aether Carbine', 'Masterwork Smith Tools']
      }
    ],
    quests: [
      {
        id: 'qst-1',
        title: 'Silence the Dissonance Bells',
        giver: 'Lord Commander Kaelen Thorne',
        status: 'Active',
        reward: '2,500 Aurean Crowns & Sky-Skiff Charter',
        summary: 'Infiltrate the eastern rim of the Shattered Caldera and disable the Obsidian Synod acoustic battery before the lunar conjunction.'
      },
      {
        id: 'qst-2',
        title: 'The Smuggler’s Kiln',
        giver: 'Chief Artificer Lyra Vaelen',
        status: 'Completed',
        reward: 'Harmonic Shield Brooches',
        summary: 'Trace the origin of contraband Star-Fallen Orichalcum cylinders found in the lower sky-docks.'
      }
    ],
    sessions: [
      {
        id: 'ses-4',
        number: 4,
        title: 'Ambush in the Glasswind',
        date: '2026-11-08',
        summary: 'The party boarded a rogue Iron Covenant barge during a silica squall and recovered Malakor’s cipher.',
        gmSecretOutcome: 'One Synod acolyte escaped via glide-cloak and alerted the Caldera garrison.'
      }
    ],
    handouts: [
      {
        id: 'ho-1',
        title: 'Recovered Cipher of Archon Valerius (409 SR)',
        content: '“Do not let the Synod convince the Senate that the pilings are failing from age. They are being drained from the Spire of Zero.”',
        revealedToPlayers: true
      },
      {
        id: 'ho-2',
        title: 'Schematic: Basilisk Resonance Cannon',
        content: 'Confidential Synod blueprint showing how acoustic waves can shatter levitating basalt.',
        revealedToPlayers: false
      }
    ],
    statblocks: [
      {
        id: 'sb-1',
        name: 'Obsidian Choir-Inquisitor',
        type: 'Medium Humanoid (Synod Zealot)',
        challengeRating: 'CR 6 (2,300 XP)',
        armorClass: 17,
        hitPoints: '97 (13d8 + 39)',
        speed: '30 ft., glide 40 ft.',
        stats: { STR: 12, DEX: 16, CON: 16, INT: 14, WIS: 18, CHA: 15 },
        abilities: [
          'Resonance Damping Aura (30 ft.): Suppresses active Aether-tech and imposes disadvantage on concentration checks.',
          'Caldera-Born Sight: Unimpeded vision through volcanic ash and silica fog.'
        ],
        actions: [
          'Multiattack: Makes two Chime-Staff strikes or two Dissonant Lance casts.',
          'Dissonant Lance (Ranged Spell, +7 to hit, 90 ft.): 21 (4d8 + 3) thunder damage and target is deafened until end of next turn.'
        ]
      }
    ]
  }
];

export const INITIAL_IP_PIPELINE_ASSETS: IPPipelineAsset[] = [
  {
    id: 'ip-1',
    worldId: 'world-aethelgard',
    bibleType: 'Character Bible',
    title: 'Empress Seraphina Vance — Orthographic Turnaround & Material Callouts',
    code: 'CHR-AET-001',
    owner: 'Marcus Vance',
    approvalStatus: 'Approved',
    versionCompareNote: 'v3.2 vs v3.0: Replaced silver pauldrons with brushed brass astrolabe rings for silhouette clarity.',
    specs: 'Height: 178cm | Primary Silhouette: Structured high-collar imperial coat | Key Prop: Astral Scepter of Solis',
    linkedArticleId: 'art-seraphina',
    colorPalette: ['#1E1B4B', '#D97706', '#F8FAFC', '#78350F'],
    reviewerFeedback: 'Approved for 3D modeling and graphic novel cover illustration.'
  },
  {
    id: 'ip-2',
    worldId: 'world-aethelgard',
    bibleType: 'Environment Bible',
    title: 'Sunspire Citadel — Lower Piling Cistern & Sky-Dock Lighting Key',
    code: 'ENV-AET-004',
    owner: 'Marcus Vance',
    approvalStatus: 'Pending Review',
    versionCompareNote: 'v1.4: Added bioluminescent amber condensation mist around Piling #3.',
    specs: 'Scale: 300m vertical vault | Lighting: Warm amber Aether core vs cool high-altitude sky light',
    linkedArticleId: 'art-sunspire',
    colorPalette: ['#0F172A', '#F59E0B', '#38BDF8', '#334155'],
    reviewerFeedback: 'Verify scale of cargo dreadnought docking clamps with Chapter 1 Scene 1.1.'
  },
  {
    id: 'ip-3',
    worldId: 'world-aethelgard',
    bibleType: 'Prop Database',
    title: 'Astral Scepter of Solis — Mechanical Gyroscope Cutaway',
    code: 'PRP-AET-012',
    owner: 'Sora Takahashi',
    approvalStatus: 'Approved',
    versionCompareNote: 'v2.0: Added counter-rotating diamond prism core.',
    specs: 'Length: 142cm | Material: White Star-Fallen Orichalcum & Diamond Aether-Glass',
    linkedArticleId: 'art-scepter',
    colorPalette: ['#FDE68A', '#38BDF8', '#E2E8F0', '#1E293B'],
    reviewerFeedback: 'Matches Lyra Vaelen’s technical description in Encyclopedia.'
  },
  {
    id: 'ip-4',
    worldId: 'world-aethelgard',
    bibleType: 'Episode Breakdown',
    title: 'Animated Pilot Episode 101: "The Alabaster Fault"',
    code: 'EPI-AET-101',
    owner: 'Elena Rostova',
    approvalStatus: 'Revision Requested',
    versionCompareNote: 'v1.1: Condensed Act I council sequence from 6 minutes to 4 minutes.',
    specs: 'Runtime: 24 mins | Locations: Lower Cistern, Alabaster Dais, Skywatch Bastion',
    linkedArticleId: 'art-siege-ashfall',
    colorPalette: ['#0F172A', '#D97706', '#EF4444'],
    reviewerFeedback: 'Add a 20-second visual flashback to the 402 SR Siege of Ashfall when Kaelen enters.'
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Elena Rostova',
    authorRole: 'Workspace Owner',
    worldTitle: 'Aethelgard: The Shattered Crown',
    title: 'Designing Non-Euclidean Sky-Archipelago Trade Routes & Aether Economics',
    category: 'Showcase',
    content: 'We just published our v2.4 canon update for Aethelgard! Check out how our Custom Lunar Calendar directly drives gravitational tides in the Shattered Caldera and impacts Iron Covenant sky-steel tariffs.',
    likes: 48,
    poll: {
      question: 'Which faction should receive the next deep-dive Character & Prop Bible expansion?',
      options: [
        { label: 'The Iron Covenant Foundry Lords', votes: 64 },
        { label: 'Vaeloria Deep-Sea Bathysphere Guilds', votes: 89 },
        { label: 'The Free Sky-Mariner Flotillas', votes: 52 }
      ]
    },
    replies: [
      { id: 'rep-1', author: 'Dante Moretti', text: 'The Vaeloria bathysphere pressure mechanics worked amazingly in last night’s RPG playtest!', timestamp: '3 hours ago' },
      { id: 'rep-2', author: 'Aria Chen', text: 'Voted for Vaeloria—the bioluminescent color script in the IP Bible is gorgeous.', timestamp: '1 hour ago' }
    ]
  }
];
