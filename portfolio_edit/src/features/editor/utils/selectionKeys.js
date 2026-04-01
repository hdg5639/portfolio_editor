const CARD_KEYS = Object.freeze({
  profile: 'profileCard',
  projects: 'projectsCard',
  skills: 'skillsCard',
  awards: 'awardsCard',
  certificates: 'certificatesCard',
  custom: 'customCard',
});

function joinKey(...parts) {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join('.');
}

export function isCardSelectionKey(key) {
  return Object.values(CARD_KEYS).includes(key);
}

export function matchesSelectionScope(selectedKey, prefix) {
  if (!selectedKey || !prefix) return false;
  return selectedKey === prefix || selectedKey.startsWith(`${prefix}.`);
}

export function getCardKeyForSection(sectionKind) {
  return CARD_KEYS[sectionKind] || null;
}

export const SelectionKey = Object.freeze({
  page: () => 'page',
  card: {
    profile: () => CARD_KEYS.profile,
    projects: () => CARD_KEYS.projects,
    skills: () => CARD_KEYS.skills,
    awards: () => CARD_KEYS.awards,
    certificates: () => CARD_KEYS.certificates,
    custom: () => CARD_KEYS.custom,
  },
  sectionTitle: (sectionKind, sectionId) => {
    if (sectionKind === 'custom' && sectionId) return joinKey('section', 'custom', sectionId, 'title');
    return joinKey('section', sectionKind, 'title');
  },
  profile: {
    field: (field) => joinKey('profile', field),
    contact: (contactId, field) => joinKey('profile', 'contacts', contactId, field),
    extraBlock: (blockId, field) => joinKey('profile', 'extraBlocks', blockId, field),
    block: (blockKey) => joinKey('profileBlock', blockKey),
  },
  project: {
    item: (projectId) => joinKey('projects', projectId),
    field: (projectId, field) => joinKey('projects', projectId, field),
    block: (projectId, blockId) => joinKey('projects', projectId, 'blocks', blockId),
    blockField: (projectId, blockId, field) => joinKey('projects', projectId, 'blocks', blockId, field),
  },
  skill: {
    row: (skillId) => joinKey('skills', skillId),
    field: (skillId, field) => joinKey('skills', skillId, field),
  },
  timeline: {
    item: (sectionKey, itemId) => joinKey(sectionKey, itemId),
    field: (sectionKey, itemId, field) => joinKey(sectionKey, itemId, field),
  },
  custom: {
    item: (sectionId, itemId) => joinKey('custom', sectionId, itemId),
    field: (sectionId, itemId, field) => joinKey('custom', sectionId, itemId, field),
    tech: (sectionId, itemId, index) => joinKey('custom', sectionId, itemId, 'tech', index),
    block: (sectionId, itemId, blockId) => joinKey('custom', sectionId, itemId, 'blocks', blockId),
    blockField: (sectionId, itemId, blockId, field) => joinKey('custom', sectionId, itemId, 'blocks', blockId, field),
  },
});

export function parseSelectionKey(key) {
  if (!key) return { type: 'none', key };
  if (key === SelectionKey.page()) return { type: 'page', key };
  if (isCardSelectionKey(key)) return { type: 'card', key, cardKey: key };

  let match = key.match(/^section\.(profile|projects|skills|awards|certificates)\.title$/);
  if (match) return { type: 'sectionTitle', key, sectionKind: match[1] };

  match = key.match(/^section\.custom\.([^.]+)\.title$/);
  if (match) return { type: 'customSectionTitle', key, sectionKind: 'custom', sectionId: match[1] };

  match = key.match(/^profileBlock\.(.+)$/);
  if (match) return { type: 'profileBlock', key, blockKey: match[1] };

  match = key.match(/^profile\.contacts\.([^.]+)(?:\.(.+))?$/);
  if (match) return { type: 'profileContact', key, contactId: match[1], field: match[2] || null };

  match = key.match(/^profile\.extraBlocks\.([^.]+)(?:\.(.+))?$/);
  if (match) return { type: 'profileExtraBlock', key, blockId: match[1], field: match[2] || null };

  match = key.match(/^profile\.([^.]+)$/);
  if (match) return { type: 'profileField', key, field: match[1] };

  match = key.match(/^skills\.([^.]+)(?:\.(.+))?$/);
  if (match) return { type: match[2] ? 'skillField' : 'skillRow', key, skillId: match[1], field: match[2] || null };

  match = key.match(/^(awards|certificates)\.([^.]+)(?:\.(.+))?$/);
  if (match) return {
    type: match[3] ? 'timelineField' : 'timelineItem',
    key,
    sectionKey: match[1],
    itemId: match[2],
    field: match[3] || null,
  };

  match = key.match(/^projects\.([^.]+)\.blocks\.([^.]+)(?:\.(.+))?$/);
  if (match) return {
    type: match[3] ? 'projectBlockField' : 'projectBlock',
    key,
    projectId: match[1],
    blockId: match[2],
    field: match[3] || null,
  };

  match = key.match(/^projects\.([^.]+)(?:\.(.+))?$/);
  if (match) return { type: match[2] ? 'projectField' : 'projectItem', key, projectId: match[1], field: match[2] || null };

  match = key.match(/^custom\.([^.]+)\.([^.]+)\.blocks\.([^.]+)(?:\.(.+))?$/);
  if (match) return {
    type: match[4] ? 'customBlockField' : 'customBlock',
    key,
    sectionId: match[1],
    itemId: match[2],
    blockId: match[3],
    field: match[4] || null,
  };

  match = key.match(/^custom\.([^.]+)\.([^.]+)(?:\.(.+))?$/);
  if (match) return {
    type: match[3] ? 'customItemField' : 'customItem',
    key,
    sectionId: match[1],
    itemId: match[2],
    field: match[3] || null,
  };

  return { type: 'element', key };
}

export function getSelectionTypeLabelFromKey(selectedKey) {
  const parsed = parseSelectionKey(selectedKey);

  switch (parsed.type) {
    case 'none':
      return '선택 없음';
    case 'page':
      return '페이지';
    case 'card':
      return '카드';
    case 'profileBlock':
    case 'projectBlock':
    case 'customBlock':
    case 'projectItem':
    case 'skillRow':
    case 'timelineItem':
    case 'customItem':
      return '블럭';
    default:
      return '요소';
  }
}

export function getCardStyleKeyForElement(key) {
  const parsed = parseSelectionKey(key);

  switch (parsed.type) {
    case 'card':
      return parsed.cardKey;
    case 'sectionTitle':
      return getCardKeyForSection(parsed.sectionKind);
    case 'customSectionTitle':
      return CARD_KEYS.custom;
    case 'profileField':
    case 'profileContact':
    case 'profileExtraBlock':
    case 'profileBlock':
      return CARD_KEYS.profile;
    case 'projectItem':
    case 'projectField':
    case 'projectBlock':
    case 'projectBlockField':
      return CARD_KEYS.projects;
    case 'skillRow':
    case 'skillField':
      return CARD_KEYS.skills;
    case 'timelineItem':
    case 'timelineField':
      return parsed.sectionKey === 'awards' ? CARD_KEYS.awards : CARD_KEYS.certificates;
    case 'customItem':
    case 'customItemField':
    case 'customBlock':
    case 'customBlockField':
      return CARD_KEYS.custom;
    default:
      return null;
  }
}

export function getAncestorElementKeys(key) {
  const parsed = parseSelectionKey(key);

  switch (parsed.type) {
    case 'profileField': {
      if (parsed.field === 'image') return [SelectionKey.profile.block('image')];
      if (parsed.field === 'quote') return [SelectionKey.profile.block('quote')];
      if (parsed.field === 'intro') return [SelectionKey.profile.block('intro')];
      if (parsed.field === 'name' || parsed.field === 'role') return [SelectionKey.profile.block('identity')];
      return [];
    }
    case 'profileContact':
      return [SelectionKey.profile.field('contacts'), SelectionKey.profile.block('contacts')];
    case 'profileExtraBlock':
      return [SelectionKey.profile.block(`extra:${parsed.blockId}`)];
    case 'skillField':
      return [SelectionKey.skill.row(parsed.skillId)];
    case 'timelineField':
      return [SelectionKey.timeline.item(parsed.sectionKey, parsed.itemId)];
    case 'projectField':
      return [SelectionKey.project.item(parsed.projectId)];
    case 'projectBlockField':
      return [
        SelectionKey.project.item(parsed.projectId),
        SelectionKey.project.block(parsed.projectId, parsed.blockId),
      ];
    case 'customItemField':
      return [SelectionKey.custom.item(parsed.sectionId, parsed.itemId)];
    case 'customBlockField':
      return [
        SelectionKey.custom.item(parsed.sectionId, parsed.itemId),
        SelectionKey.custom.block(parsed.sectionId, parsed.itemId, parsed.blockId),
      ];
    default:
      return [];
  }
}
