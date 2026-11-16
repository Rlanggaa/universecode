import { ArticleTemplate, TutorialModule } from '../types/worldbuilding';

export const BUILT_IN_TEMPLATES: ArticleTemplate[] = [
  {
    id: 'tpl-character',
    name: 'Character',
    category: 'Dramatis Personae',
    description: 'Comprehensive character profile covering biography, psychology, arc, combat/skill profile, appearance, voice, and entity connections.',
    isBuiltIn: true,
    fields: [
      { id: 'c-1', key: 'fullName', label: 'Full Name', type: 'Text', prompt: 'Full birth name and formal titles.', required: true, section: 'Identity' },
      { id: 'c-2', key: 'alias', label: 'Alias / Epithet', type: 'Text', prompt: 'Known monikers, callsigns, or secret identities.', required: false, section: 'Identity' },
      { id: 'c-3', key: 'age', label: 'Age', type: 'Text', prompt: 'Chronological and biological age.', required: false, section: 'Identity' },
      { id: 'c-4', key: 'gender', label: 'Gender & Pronouns', type: 'Text', prompt: 'Gender identity and pronouns.', required: false, section: 'Identity' },
      { id: 'c-5', key: 'species', label: 'Species / Ancestry', type: 'Entity Reference', prompt: 'Link to Species or Culture article.', required: false, section: 'Identity' },
      { id: 'c-6', key: 'occupation', label: 'Occupation / Rank', type: 'Text', prompt: 'Current profession, rank, or societal station.', required: false, section: 'Identity' },
      { id: 'c-7', key: 'personality', label: 'Personality', type: 'Long Text', prompt: 'Core temperament, habits, virtues, and vices.', required: false, section: 'Psychology & Arc' },
      { id: 'c-8', key: 'motivation', label: 'Core Motivation', type: 'Long Text', prompt: 'What drives this character externally and internally?', required: true, section: 'Psychology & Arc' },
      { id: 'c-9', key: 'background', label: 'Background & Origin', type: 'Long Text', prompt: 'Formative life events and upbringing.', required: false, section: 'Psychology & Arc' },
      { id: 'c-10', key: 'characterArc', label: 'Character Arc', type: 'Long Text', prompt: 'Starting state, crucible, transformation, and resolution.', required: false, section: 'Psychology & Arc' },
      { id: 'c-11', key: 'strengths', label: 'Strengths', type: 'Text', prompt: 'Key competencies and moral or tactical advantages.', required: false, section: 'Capabilities' },
      { id: 'c-12', key: 'weaknesses', label: 'Weaknesses & Flaws', type: 'Text', prompt: 'Blind spots, vulnerabilities, or curses.', required: false, section: 'Capabilities' },
      { id: 'c-13', key: 'skills', label: 'Mundane Skills', type: 'Text', prompt: 'Trained crafts, languages, and martial proficiencies.', required: false, section: 'Capabilities' },
      { id: 'c-14', key: 'abilities', label: 'Special / Arcane Abilities', type: 'Long Text', prompt: 'Supernatural powers, cybernetics, or signature techniques.', required: false, section: 'Capabilities' },
      { id: 'c-15', key: 'appearance', label: 'Physical Appearance', type: 'Long Text', prompt: 'Physique, scars, eyes, posture, and distinguishing marks.', required: false, section: 'Presentation' },
      { id: 'c-16', key: 'costume', label: 'Signature Attire & Gear', type: 'Long Text', prompt: 'Wardrobe, armor, insignia, and carried items.', required: false, section: 'Presentation' },
      { id: 'c-17', key: 'voice', label: 'Voice & Mannerisms', type: 'Text', prompt: 'Cadence, pitch, dialect, and catchphrases.', required: false, section: 'Presentation' },
      { id: 'c-18', key: 'relationships', label: 'Key Relationships', type: 'Entity Reference', prompt: 'Allies, rivals, family, and mentors.', required: false, section: 'Connections' },
      { id: 'c-19', key: 'gallery', label: 'Concept Art / Portrait URL', type: 'Image', prompt: 'Reference portrait or turnaround sheet identifier.', required: false, section: 'Connections' },
      { id: 'c-20', key: 'relatedLocations', label: 'Related Locations', type: 'Entity Reference', prompt: 'Birthplace, headquarters, or current residence.', required: false, section: 'Connections' },
      { id: 'c-21', key: 'relatedOrganizations', label: 'Related Organizations', type: 'Entity Reference', prompt: 'Factions, guilds, or houses affiliated.', required: false, section: 'Connections' }
    ]
  },
  {
    id: 'tpl-settlement',
    name: 'Location - Settlement',
    category: 'Geography & Places',
    description: 'Cities, towns, orbital habitats, and fortified outposts.',
    isBuiltIn: true,
    fields: [
      { id: 's-1', key: 'settlementType', label: 'Settlement Classification', type: 'Dropdown', options: ['Metropolis', 'Citadel', 'Port City', 'Frontier Town', 'Orbital Habitat', 'Sanctuary'], prompt: 'Scale and function.', required: true },
      { id: 's-2', key: 'population', label: 'Population', type: 'Number', prompt: 'Approximate census count.', required: false },
      { id: 's-3', key: 'government', label: 'Governing Body', type: 'Entity Reference', prompt: 'Ruling faction, council, or monarch.', required: false },
      { id: 's-4', key: 'economy', label: 'Trade & Exports', type: 'Long Text', prompt: 'Primary industries, guilds, and scarce imports.', required: false },
      { id: 's-5', key: 'defenses', label: 'Defenses & Architecture', type: 'Long Text', prompt: 'Walls, wards, garrison, and urban layout.', required: false }
    ]
  },
  {
    id: 'tpl-geographic',
    name: 'Location - Geographic',
    category: 'Geography & Places',
    description: 'Continents, mountain ranges, seas, anomalies, and biomes.',
    isBuiltIn: true,
    fields: [
      { id: 'g-1', key: 'biome', label: 'Biome / Climate', type: 'Text', prompt: 'Ecological zone and weather patterns.', required: true },
      { id: 'g-2', key: 'resources', label: 'Natural Resources', type: 'Text', prompt: 'Minerals, flora, fauna, and ley-lines.', required: false },
      { id: 'g-3', key: 'hazards', label: 'Environmental Hazards', type: 'Long Text', prompt: 'Natural or supernatural perils in this region.', required: false }
    ]
  },
  {
    id: 'tpl-building',
    name: 'Location - Building',
    category: 'Geography & Places',
    description: 'Temples, fortresses, taverns, laboratories, and landmarks.',
    isBuiltIn: true,
    fields: [
      { id: 'b-1', key: 'architecturalStyle', label: 'Architectural Style', type: 'Text', prompt: 'Materials, era of construction, and aesthetic.', required: true },
      { id: 'b-2', key: 'ownerEntity', label: 'Proprietor / Custodian', type: 'Entity Reference', prompt: 'Who controls or maintains this structure?', required: false },
      { id: 'b-3', key: 'securityTraps', label: 'Security & Secret Passages', type: 'Long Text', prompt: 'Locks, guards, wards, and hidden vaults.', required: false }
    ]
  },
  {
    id: 'tpl-organization',
    name: 'Organization',
    category: 'Society & Politics',
    description: 'Empires, guilds, noble houses, megacorporations, and secret orders.',
    isBuiltIn: true,
    fields: [
      { id: 'o-1', key: 'orgType', label: 'Organization Type', type: 'Dropdown', options: ['Sovereign State', 'Noble House', 'Arcane Order', 'Mercenary Guild', 'Syndicate', 'Religious Sect'], prompt: 'Primary structure.', required: true },
      { id: 'o-2', key: 'motto', label: 'Motto / Creed', type: 'Text', prompt: 'Official words or ideological slogan.', required: false },
      { id: 'o-3', key: 'leader', label: 'Current Leadership', type: 'Entity Reference', prompt: 'Head of state or grandmaster.', required: false },
      { id: 'o-4', key: 'headquarters', label: 'Seat of Power', type: 'Entity Reference', prompt: 'Capital or primary stronghold.', required: false },
      { id: 'o-5', key: 'agenda', label: 'Public & Hidden Agenda', type: 'Long Text', prompt: 'Goals, geopolitical doctrine, and internal schisms.', required: true }
    ]
  },
  {
    id: 'tpl-item',
    name: 'Item',
    category: 'Artifacts & Tech',
    description: 'Relics, weapons, regalia, instruments, and key props.',
    isBuiltIn: true,
    fields: [
      { id: 'i-1', key: 'rarity', label: 'Rarity / Classification', type: 'Dropdown', options: ['Mundane', 'Masterwork', 'Rare', 'Relic', 'Unique Artifact'], prompt: 'Scarcity tier.', required: true },
      { id: 'i-2', key: 'creator', label: 'Artificer / Origin', type: 'Entity Reference', prompt: 'Who forged or engineered this item?', required: false },
      { id: 'i-3', key: 'properties', label: 'Capabilities & Mechanics', type: 'Long Text', prompt: 'Powers, limitations, and activation requirements.', required: true }
    ]
  },
  {
    id: 'tpl-species',
    name: 'Species',
    category: 'Biology & Ecology',
    description: 'Sapient ancestries, beasts, flora, and extradimensional beings.',
    isBuiltIn: true,
    fields: [
      { id: 'sp-1', key: 'lifespan', label: 'Average Lifespan', type: 'Text', prompt: 'Maturity and longevity.', required: true },
      { id: 'sp-2', key: 'physiology', label: 'Physiology & Morphology', type: 'Long Text', prompt: 'Anatomy, senses, and biological adaptations.', required: true },
      { id: 'sp-3', key: 'habitat', label: 'Native Habitat', type: 'Entity Reference', prompt: 'Homeworld or cradle region.', required: false }
    ]
  },
  {
    id: 'tpl-spell',
    name: 'Spell',
    category: 'Arcana & Systems',
    description: 'Incantations, rituals, psionic disciplines, and miracles.',
    isBuiltIn: true,
    fields: [
      { id: 'spl-1', key: 'circleTier', label: 'Tier / Resonance Circle', type: 'Text', prompt: 'Magnitude or complexity class.', required: true },
      { id: 'spl-2', key: 'cost', label: 'Catalyst & Toll', type: 'Text', prompt: 'Material components and physiological strain.', required: true },
      { id: 'spl-3', key: 'manifestation', label: 'Effect & Sensory Manifestation', type: 'Long Text', prompt: 'Visuals, acoustics, and mechanical impact.', required: true }
    ]
  },
  {
    id: 'tpl-conflict',
    name: 'Conflict',
    category: 'History & Lore',
    description: 'Wars, sieges, rebellions, diplomatic crises, and duels.',
    isBuiltIn: true,
    fields: [
      { id: 'cf-1', key: 'dateRange', label: 'Chronological Span', type: 'Date', prompt: 'Start and end dates in world calendar.', required: true },
      { id: 'cf-2', key: 'belligerents', label: 'Belligerents', type: 'Entity Reference', prompt: 'Opposing coalitions and commanders.', required: true },
      { id: 'cf-3', key: 'aftermath', label: 'Treaty & Geopolitical Aftermath', type: 'Long Text', prompt: 'Casualties, border shifts, and lasting scars.', required: true }
    ]
  },
  {
    id: 'tpl-myth',
    name: 'Myth / Legend',
    category: 'History & Lore',
    description: 'Creation myths, prophecies, folk tales, and apocrypha.',
    isBuiltIn: true,
    fields: [
      { id: 'my-1', key: 'culturalOrigin', label: 'Cultural Origin', type: 'Entity Reference', prompt: 'Which culture transmits this myth?', required: true },
      { id: 'my-2', key: 'historicalTruth', label: 'Kernel of Historical Truth', type: 'Long Text', prompt: 'What actually happened vs what is believed?', required: true }
    ]
  },
  {
    id: 'tpl-condition',
    name: 'Condition',
    category: 'Biology & Ecology',
    description: 'Afflictions, curses, blessings, maladies, and mutations.',
    isBuiltIn: true,
    fields: [
      { id: 'cd-1', key: 'transmission', label: 'Transmission Vector', type: 'Text', prompt: 'How is the condition contracted?', required: true },
      { id: 'cd-2', key: 'symptoms', label: 'Progressive Symptoms & Cure', type: 'Long Text', prompt: 'Stages of progression and known remedies.', required: true }
    ]
  },
  {
    id: 'tpl-document',
    name: 'Document',
    category: 'History & Lore',
    description: 'Treaties, grimoires, letters, edicts, and epigraphs.',
    isBuiltIn: true,
    fields: [
      { id: 'dc-1', key: 'authorSignatory', label: 'Author / Signatories', type: 'Entity Reference', prompt: 'Scribe or ratifying powers.', required: true },
      { id: 'dc-2', key: 'verbatimExcerpt', label: 'In-World Verbatim Excerpt', type: 'Long Text', prompt: 'Direct quotation from the primary text.', required: true }
    ]
  },
  {
    id: 'tpl-ethnicity',
    name: 'Ethnicity / Culture',
    category: 'Society & Politics',
    description: 'Cultural traditions, customs, aesthetics, and values.',
    isBuiltIn: true,
    fields: [
      { id: 'et-1', key: 'values', label: 'Core Taboos & Virtues', type: 'Long Text', prompt: 'What is revered or forbidden in this culture?', required: true },
      { id: 'et-2', key: 'cuisineArt', label: 'Cuisine, Dress & Art', type: 'Long Text', prompt: 'Daily life and artistic motifs.', required: false }
    ]
  },
  {
    id: 'tpl-military',
    name: 'Military Unit',
    category: 'Society & Politics',
    description: 'Legions, fleets, knightly orders, and strike wings.',
    isBuiltIn: true,
    fields: [
      { id: 'mu-1', key: 'strength', label: 'Troop / Fleet Strength', type: 'Text', prompt: 'Active personnel and armament.', required: true },
      { id: 'mu-2', key: 'doctrine', label: 'Combat Doctrine', type: 'Long Text', prompt: 'Tactics, training regimen, and operational theater.', required: true }
    ]
  },
  {
    id: 'tpl-language',
    name: 'Language',
    category: 'Society & Politics',
    description: 'Conlangs, scripts, dialects, and cryptographic ciphers.',
    isBuiltIn: true,
    fields: [
      { id: 'lg-1', key: 'scriptType', label: 'Writing System & Phonology', type: 'Text', prompt: 'Alphabetic, logographic, runic, or tonal.', required: true },
      { id: 'lg-2', key: 'lexiconSample', label: 'Sample Phrases & Idioms', type: 'Long Text', prompt: 'Greetings, proverbs, and naming conventions.', required: true }
    ]
  },
  {
    id: 'tpl-material',
    name: 'Material',
    category: 'Artifacts & Tech',
    description: 'Ores, alloys, textiles, alchemical reagents, and metamaterials.',
    isBuiltIn: true,
    fields: [
      { id: 'mt-1', key: 'source', label: 'Extraction / Synthesis Source', type: 'Text', prompt: 'Where is it mined, harvested, or refined?', required: true },
      { id: 'mt-2', key: 'applications', label: 'Metallurgical / Arcane Uses', type: 'Long Text', prompt: 'Conductivity, tensile properties, and value.', required: true }
    ]
  },
  {
    id: 'tpl-naturallaw',
    name: 'Natural Law',
    category: 'Arcana & Systems',
    description: 'Cosmological axioms, magic laws, thermodynamics, and metaphysics.',
    isBuiltIn: true,
    fields: [
      { id: 'nl-1', key: 'axiom', label: 'Fundamental Axiom', type: 'Text', prompt: 'Concisely state the universal rule.', required: true },
      { id: 'nl-2', key: 'consequences', label: 'Systemic Consequences', type: 'Long Text', prompt: 'How does this law shape technology, magic, or society?', required: true }
    ]
  },
  {
    id: 'tpl-prose',
    name: 'Prose',
    category: 'Story & Narrative',
    description: 'Short stories, vignettes, ballads, and in-universe chronicles.',
    isBuiltIn: true,
    fields: [
      { id: 'pr-1', key: 'povCharacter', label: 'Point of View', type: 'Entity Reference', prompt: 'Narrator or focal character.', required: false },
      { id: 'pr-2', key: 'settingTime', label: 'Chronological Setting', type: 'Date', prompt: 'When does this piece take place?', required: false }
    ]
  },
  {
    id: 'tpl-profession',
    name: 'Profession',
    category: 'Society & Politics',
    description: 'Vocations, social classes, guild ranks, and callings.',
    isBuiltIn: true,
    fields: [
      { id: 'pf-1', key: 'socialStanding', label: 'Social Standing & Pay', type: 'Text', prompt: 'How is this vocation perceived and compensated?', required: true },
      { id: 'pf-2', key: 'toolsOfTrade', label: 'Tools & Guild Licensing', type: 'Long Text', prompt: 'Required instruments, apprenticeship, and hazards.', required: true }
    ]
  },
  {
    id: 'tpl-plot',
    name: 'Plot',
    category: 'Story & Narrative',
    description: 'Story arcs, mystery threads, geopolitical schemes, and campaign hooks.',
    isBuiltIn: true,
    fields: [
      { id: 'pl-1', key: 'arcStructure', label: 'Narrative Structure', type: 'Dropdown', options: ['Three-Act', 'Five-Act', 'Kishotenketsu', 'Heist / Intrigue', 'Sandbox Campaign'], prompt: 'Structural framework.', required: true },
      { id: 'pl-2', key: 'stakes', label: 'Central Conflict & Stakes', type: 'Long Text', prompt: 'What happens if the protagonists fail?', required: true }
    ]
  },
  {
    id: 'tpl-title',
    name: 'Title',
    category: 'Society & Politics',
    description: 'Hereditary peerages, offices of state, ecclesiastical honors, and crowns.',
    isBuiltIn: true,
    fields: [
      { id: 'ti-1', key: 'currentHolder', label: 'Current Incumbent', type: 'Entity Reference', prompt: 'Character currently holding this office.', required: false },
      { id: 'ti-2', key: 'successionLaw', label: 'Prerogatives & Succession', type: 'Long Text', prompt: 'How is the title passed down or revoked?', required: true }
    ]
  },
  {
    id: 'tpl-session',
    name: 'Session Report',
    category: 'Story & Narrative',
    description: 'Tabletop RPG session logs, production dailies, and playtest chronicles.',
    isBuiltIn: true,
    fields: [
      { id: 'sr-1', key: 'sessionNumber', label: 'Session Number & Date', type: 'Text', prompt: 'Chronological episode index.', required: true },
      { id: 'sr-2', key: 'keyDecisions', label: 'Key Party Decisions & Consequences', type: 'Long Text', prompt: 'How did the players alter the canon world?', required: true }
    ]
  },
  {
    id: 'tpl-technology',
    name: 'Technology',
    category: 'Artifacts & Tech',
    description: 'Inventions, propulsion drives, magitek paradigms, and infrastructure.',
    isBuiltIn: true,
    fields: [
      { id: 'tc-1', key: 'techLevel', label: 'Readiness / Era Tier', type: 'Text', prompt: 'Experimental, military-restricted, or ubiquitous.', required: true },
      { id: 'tc-2', key: 'powerSource', label: 'Power Source & Dependencies', type: 'Long Text', prompt: 'Fuel, material inputs, and societal impact.', required: true }
    ]
  },
  {
    id: 'tpl-tradition',
    name: 'Tradition / Ritual',
    category: 'Society & Politics',
    description: 'Festivals, rites of passage, funerary customs, and oaths.',
    isBuiltIn: true,
    fields: [
      { id: 'tr-1', key: 'observanceDate', label: 'Calendar Observance', type: 'Text', prompt: 'Season, lunar alignment, or lifecycle milestone.', required: true },
      { id: 'tr-2', key: 'liturgy', label: 'Ceremonial Sequence', type: 'Long Text', prompt: 'Participants, vestments, offerings, and symbolism.', required: true }
    ]
  },
  {
    id: 'tpl-vehicle',
    name: 'Vehicle',
    category: 'Artifacts & Tech',
    description: 'Airships, starships, naval vessels, mechs, and siege engines.',
    isBuiltIn: true,
    fields: [
      { id: 'vh-1', key: 'crewComplement', label: 'Crew & Tonnage', type: 'Text', prompt: 'Minimum and maximum operational crew.', required: true },
      { id: 'vh-2', key: 'propulsionArmament', label: 'Propulsion & Armament', type: 'Long Text', prompt: 'Speed, range, hull plating, and weaponry.', required: true }
    ]
  },
  {
    id: 'tpl-generic',
    name: 'Generic Article',
    category: 'General Lore',
    description: 'Flexible encyclopedia entry for any concept, glossary term, or meta note.',
    isBuiltIn: true,
    fields: [
      { id: 'gn-1', key: 'keyTakeaway', label: 'Executive Summary', type: 'Text', prompt: 'One-sentence canon definition.', required: true },
      { id: 'gn-2', key: 'extendedNotes', label: 'Cross-Reference Context', type: 'Long Text', prompt: 'How this entry connects to the broader IP.', required: false }
    ]
  }
];

export const INTERACTIVE_TUTORIAL_MODULES: TutorialModule[] = [
  {
    id: 'tut-01',
    moduleNumber: '01',
    title: 'Workspace Management',
    category: 'Foundation',
    targetNavTab: 'dashboard',
    whatIsIt: 'Your top-level studio container that houses multiple fictional universes, team members, project variables, and storage policies.',
    whatIsItUsedFor: 'Separating personal creative IP from studio team projects, managing collaborator permissions (Owner, Admin, Editor, Contributor, Reviewer, Viewer), and exporting full backups.',
    howDoesItWork: 'Workspaces sit at Level 2 of the hierarchy above Universes and Worlds. Switching workspaces updates the active worlds, member roster, and global variables.',
    stepByStep: [
      'Open the Dashboard or Settings view from the left navigation.',
      'Inspect the Workspace header to view active Universe and World counts.',
      'Manage collaborator roles in the Role & Permission matrix or define global {{variables}}.'
    ],
    practicalExample: 'Solstice Creative Studio uses one Workspace to manage both their dark-fantasy IP "Chronicles of Aethelgard" and their sci-fi IP "Helios Horizon".',
    commonMistakes: [
      'Confusing a Workspace with a single World — one Workspace can hold many Universes and Worlds.',
      'Forgetting to export periodic JSON backups before major canon restructures.'
    ]
  },
  {
    id: 'tut-02',
    moduleNumber: '02',
    title: 'World Creation & Universe Manager',
    category: 'Foundation',
    targetNavTab: 'worlds',
    whatIsIt: 'The multi-universe and world management hub where each setting gets its own encyclopedia, maps, timelines, and visual identity.',
    whatIsItUsedFor: 'Creating new worlds, grouping worlds under shared Universes, duplicating worlds for alternate timelines, and tracking word/entity statistics.',
    howDoesItWork: 'Select any World card to make it the active context across all 17 platform modules, or click "+ New World" to initialize a fresh setting.',
    stepByStep: [
      'Navigate to Worlds in the left sidebar.',
      'Click "Create World" and specify its Name, parent Universe, Genre, and Synopsis.',
      'Use "Duplicate World" to branch a setting or "Switch Active World" to focus your workspace.'
    ],
    practicalExample: 'Creating "Aethelgard: The Shattered Crown" and "Vaeloria: Deep Sea Republics" inside the same Universe so articles can transfer between them.',
    commonMistakes: [
      'Putting two unrelated genres in the same World instead of creating a second World inside your Workspace.'
    ]
  },
  {
    id: 'tut-03',
    moduleNumber: '03',
    title: 'Article & Wiki Editor + Auto-Linking',
    category: 'Encyclopedia',
    targetNavTab: 'articles',
    whatIsIt: 'A rich wiki documentation engine with structured templates, spoiler/secret blocks, version history, and automatic entity mention detection.',
    whatIsItUsedFor: 'Writing canonical lore entries, linking characters to locations and events, hiding GM/author secrets from public readers, and tracking revisions.',
    howDoesItWork: 'As you write, the Auto-Link Scanner detects names or aliases of other articles in your World and offers one-click internal `[[Wiki Links]]` and backlink tracking.',
    stepByStep: [
      'Open Encyclopedia & Templates and select an article or click "+ New Article".',
      'Write prose in the editor and click "Scan Auto-Links" to highlight detected entity names.',
      'Accept all recommendations or toggle individual links, then save a Version Snapshot.'
    ],
    practicalExample: 'Mentioning "Empress Seraphina Vance" or "Sunspire Citadel" inside a Conflict article automatically creates clickable cross-references and updates the Context Sidebar backlinks.',
    commonMistakes: [
      'Writing confidential plot twists in the public body instead of the "Secret Author / GM Notes" field.',
      'Skipping version notes when making major canon retcons.'
    ]
  },
  {
    id: 'tut-04',
    moduleNumber: '04',
    title: 'Custom Template Builder',
    category: 'Encyclopedia',
    targetNavTab: 'templates',
    whatIsIt: 'A schema designer with 26 built-in worldbuilding templates plus a custom field builder supporting 12 data types.',
    whatIsItUsedFor: 'Standardizing lore entries (e.g., ensuring every Spell has a Catalyst Cost or every Mecha has a Reactor Output) with tailored writing prompts.',
    howDoesItWork: 'Choose any of the 26 built-in templates or create a custom template by adding, reordering, and configuring fields (Text, Dropdown, Entity Reference, Repeater, etc.).',
    stepByStep: [
      'Switch to the "Template System & Builder" tab inside Encyclopedia.',
      'Browse the 26 built-in templates or click "+ New Custom Template".',
      'Add custom fields, set field types and prompts, and immediately use the template in the Article Editor.'
    ],
    practicalExample: 'Adding a "Resonance Frequency" Number field and "Guild Clearance" Dropdown field to a custom Aether-Tech template.',
    commonMistakes: [
      'Making every single field required, which slows down rapid idea capture during early brainstorming.'
    ]
  },
  {
    id: 'tut-05',
    moduleNumber: '05',
    title: 'Character Management',
    category: 'Dramatis Personae',
    targetNavTab: 'characters',
    whatIsIt: 'A dedicated roster for managing protagonists, antagonists, historical figures, and NPCs with 21 structured character attributes.',
    whatIsItUsedFor: 'Tracking character arcs, motivations, strengths, weaknesses, voice/mannerisms, wardrobe, and faction allegiances in one scannable dossier.',
    howDoesItWork: 'Filters your World database to Character entities and exposes their full psychological, physical, and relational matrices alongside manuscript appearances.',
    stepByStep: [
      'Click "Characters" in the left navigation to view the Character Dossier grid.',
      'Inspect a character to view their 21 template attributes, family bloodline, and linked scenes.',
      'Click "Edit in Wiki" to update their arc or add new relationships.'
    ],
    practicalExample: 'Tracking Lord Commander Kaelen Thorne’s motivation, physical scars, voice cadence, and his rivalry with High Inquisitor Malakor.',
    commonMistakes: [
      'Listing relationships only as plain text instead of registering them in the Relationship Graph so they appear on both characters.'
    ]
  },
  {
    id: 'tut-06',
    moduleNumber: '06',
    title: 'Relationship System & IP Knowledge Graph',
    category: 'Visual Worldbuilding',
    targetNavTab: 'relationships',
    whatIsIt: 'An interactive visual graph engine for Character Webs, Multi-Generation Family Trees, Political Diplomacy Webs, and Content Hierarchy Trees.',
    whatIsItUsedFor: 'Visualizing how characters, noble houses, factions, species, and magic branches interconnect across your IP.',
    howDoesItWork: 'Switch between 4 specialized graph views, click nodes to inspect entity details, and add new directional or bidirectional edges with relationship scores (-100 to +100).',
    stepByStep: [
      'Open "Relationships & Graphs" from the sidebar.',
      'Toggle between Character Web, Family Tree, Diplomacy Web, and Content Tree.',
      'Use "+ Add Relationship" to link any two entities and assign a relation type and diplomacy score.'
    ],
    practicalExample: 'Mapping the -85 Conflict score between the Iron Covenant and the Obsidian Synod in the Diplomacy Web.',
    commonMistakes: [
      'Keeping faction politics isolated from character family trees when royal marriages bridge both.'
    ]
  },
  {
    id: 'tut-07',
    moduleNumber: '07',
    title: 'Interactive Maps & Nested Cartography',
    category: 'Visual Worldbuilding',
    targetNavTab: 'maps',
    whatIsIt: 'A multi-layer cartography studio supporting pan/zoom, custom marker placement, character movement tracks, and nested drill-down maps.',
    whatIsItUsedFor: 'Pinning settlements, battlefields, and secret dungeons onto maps and drilling down from World Map → Region Map → City Map → Building Map.',
    howDoesItWork: 'Toggle between "Exploration Mode" (reading lore & drilling into child maps) and "Editing Mode" (clicking anywhere on the canvas to drop new markers and link articles).',
    stepByStep: [
      'Open "Interactive Maps" and select a map scale level (World, Region, City, or Building).',
      'Toggle map layers (Terrain, Political Borders, Trade Routes, Character Tracks, Secret GM).',
      'Switch to "Editing Mode" and click on the map canvas to place a new linked marker.'
    ],
    practicalExample: 'Clicking the "Sunspire Citadel" marker on the World Map to drill directly into the detailed City & Citadel interior map.',
    commonMistakes: [
      'Forgetting to mark sensitive dungeon traps with the "Hidden GM Marker" flag before publishing a map.'
    ]
  },
  {
    id: 'tut-08',
    moduleNumber: '08',
    title: 'Timelines & Parallel History',
    category: 'Visual Worldbuilding',
    targetNavTab: 'timelines',
    whatIsIt: 'A chronological history engine supporting multiple eras, parallel timeline lanes, event durations, and entity cross-links.',
    whatIsItUsedFor: 'Sequencing ancient cataclysms, imperial dynasties, and character backstories without chronological contradictions.',
    howDoesItWork: 'Events are sorted chronologically by Year, Month, and Day, grouped into historical Eras and parallel faction lanes.',
    stepByStep: [
      'Navigate to "Timelines & Chronicles".',
      'Filter events by Era, Significance, or Parallel Lane.',
      'Add a new historical event and link it to participating characters, locations, and map markers.'
    ],
    practicalExample: 'Comparing events in the "Imperial Heartland" lane against simultaneous events in the "Deep Sea Republics" lane during Year 412.',
    commonMistakes: [
      'Using vague relative dates ("long ago") instead of anchoring events to a numeric year on the world timeline.'
    ]
  },
  {
    id: 'tut-09',
    moduleNumber: '09',
    title: 'Custom Calendars & Synchronized Chronicles',
    category: 'Visual Worldbuilding',
    targetNavTab: 'chronicles',
    whatIsIt: 'A custom celestial calendar builder (custom months, weekdays, festivals, and multi-moon phases) fused with Timeline and Map in Chronicles view.',
    whatIsItUsedFor: 'Designing bespoke timekeeping systems and stepping through historical events while watching the map automatically pan to each event’s location.',
    howDoesItWork: 'In Chronicles Mode, selecting any event on the timeline updates the Calendar to that exact date/lunar phase and focuses the Interactive Map on the event marker.',
    stepByStep: [
      'Open the "Calendar & Chronicles" tab inside Timelines & Chronicles.',
      'Customize month names, day counts, and lunar orbital cycles.',
      'Click any event in the Chronicles sequence to watch the Map and Lunar Phase synchronize automatically.'
    ],
    practicalExample: 'Selecting "The Eclipse of Twin Moons (Year 418, Month 3, Day 14)" pans the map to the Shattered Caldera and renders both moons in conjunction.',
    commonMistakes: [
      'Not linking a Timeline Event to a Map Marker, which prevents Chronicles from auto-centering the map.'
    ]
  },
  {
    id: 'tut-10',
    moduleNumber: '10',
    title: 'Visual Diagrams & Infinite Whiteboard',
    category: 'Visual Worldbuilding',
    targetNavTab: 'whiteboards',
    whatIsIt: 'A freeform visual canvas for sticky notes, entity cards, plot nodes, shapes, connecting arrows, and SVG sketching.',
    whatIsItUsedFor: 'Brainstorming mystery boards, magic system flowcharts, technology trees, and episode beat sheets.',
    howDoesItWork: 'Drag nodes across the canvas, connect nodes with labeled directional edges, sketch freehand paths, and click linked Entity Cards to jump to their wiki article.',
    stepByStep: [
      'Open "Whiteboards & Diagrams" from the sidebar.',
      'Add Sticky Notes, Entity Cards, or Plot Shapes to the active board.',
      'Drag cards to rearrange your spatial layout or create connections between nodes.'
    ],
    practicalExample: 'Arranging clue cards and suspect entities on a "Royal Assassination Conspiracy" whiteboard.',
    commonMistakes: [
      'Leaving brainstormed lore trapped on sticky notes instead of promoting finalized notes into Encyclopedia articles.'
    ]
  },
  {
    id: 'tut-11',
    moduleNumber: '11',
    title: 'Manuscripts & Story Development Studio',
    category: 'Story & Production',
    targetNavTab: 'manuscripts',
    whatIsIt: 'A long-form prose and screenplay writing studio with Chapter/Scene hierarchy, Focus Mode, Word Goal tracking, and live World Database integration.',
    whatIsItUsedFor: 'Writing novels, webtoon scripts, and game narratives while referencing character bios and location lore without leaving the page.',
    howDoesItWork: 'Organize manuscripts into Chapters and draggable Scenes, switch between Editorial/Parchment/Midnight themes, insert lore references from the side drawer, and export to Markdown, TXT, DOC, or Print/PDF.',
    stepByStep: [
      'Select "Manuscripts" in the left navigation.',
      'Choose a Chapter and Scene from the outline tree, or toggle "Focus Mode" for distraction-free writing.',
      'Use the World Lore Reference drawer on the right to check character details or export your manuscript.'
    ],
    practicalExample: 'Drafting Chapter 2 in Focus Mode while verifying Kaelen’s eye color and sword properties from the integrated Lore Drawer.',
    commonMistakes: [
      'Writing an entire novel in one giant scene instead of breaking chapters into scenes so POV and Location tracking work.'
    ]
  },
  {
    id: 'tut-12',
    moduleNumber: '12',
    title: 'Publishing, Privacy & White-Label Sharing',
    category: 'Collaboration & Sharing',
    targetNavTab: 'publishing',
    whatIsIt: 'Granular access control and publication portal supporting Public, Private, Password-Protected, and Access-Code sharing plus SEO/RSS generation.',
    whatIsItUsedFor: 'Publishing a public reader-facing World Homepage while keeping unrevealed spoilers, drafts, and GM notes strictly private.',
    howDoesItWork: 'Configure world-level and article-level visibility independently, preview the Public Reader Portal, and generate shareable links, sitemaps, and RSS feeds.',
    stepByStep: [
      'Open "Publication & Community" or Settings.',
      'Set World visibility (Public, Private, or Password-Protected) and preview the Public World Homepage.',
      'Configure custom URL slugs, SEO metadata, or access codes for selected beta readers.'
    ],
    practicalExample: 'Sharing a public link to Aethelgard for tabletop players while keeping the "Inquisitor’s Secret Identity" article locked to Secret mode.',
    commonMistakes: [
      'Publishing a World without checking which draft articles are set to Public vs Private.'
    ]
  },
  {
    id: 'tut-13',
    moduleNumber: '13',
    title: 'Team Collaboration & Creative IP Pipeline',
    category: 'Collaboration & Sharing',
    targetNavTab: 'notebook',
    whatIsIt: 'A multi-role production hub combining Kanban task boards, Character/Environment/Prop Bibles, Visual Reference Moodboards, and review workflows.',
    whatIsItUsedFor: 'Coordinating writers, concept artists, game designers, and editors with role-based permissions and approval statuses.',
    howDoesItWork: 'Assign tasks on the Kanban board, track IP Bible assets from "Draft" → "Pending Review" → "Approved", and leave reviewer feedback.',
    stepByStep: [
      'Open "Notebook & IP Pipeline" from the sidebar.',
      'Switch between Project Notebook, Kanban Task Board, and Creative IP Pipeline.',
      'Update asset approval states (Approved / Revision Requested) and manage team roles in Settings.'
    ],
    practicalExample: 'Moving the "Sunspire Royal Guard Armor Sheet" from Pending Review to Approved in the Character Bible.',
    commonMistakes: [
      'Granting Admin permissions to external reviewers who only need the "Reviewer" or "Viewer" role.'
    ]
  },
  {
    id: 'tut-14',
    moduleNumber: '14',
    title: 'Data Portability, API & Studio Settings',
    category: 'Foundation',
    targetNavTab: 'settings',
    whatIsIt: 'Full data ownership export/import center, REST API & Webhook playground, custom CSS studio, and transparent resource monitor.',
    whatIsItUsedFor: 'Exporting single articles, entire worlds, or complete workspace JSON/Markdown/CSV backups, and integrating with Discord or Foundry VTT.',
    howDoesItWork: 'All features are unlocked with zero subscription paywalls. You can download your entire database as JSON or Markdown anytime and restore from backup files.',
    stepByStep: [
      'Open "Settings & API" in the left navigation.',
      'Use the Data Portability panel to export JSON, Markdown, or CSV archives.',
      'Generate API tokens or test webhook payloads in the Developer API Playground.'
    ],
    practicalExample: 'Exporting a complete JSON workspace backup before importing a CSV table of 50 alchemical reagents.',
    commonMistakes: [
      'Writing un-scoped global selectors in Custom World CSS instead of previewing in the isolated theme sandbox.'
    ]
  }
];
