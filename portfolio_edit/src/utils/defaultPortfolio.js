const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultStyle = () => ({
  color: '#1d1d1b',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: '400',
  textAlign: 'left',
  lineHeight: 1.6,
  letterSpacing: 0,
  borderColor: 'transparent',
  borderRadius: 0,
  padding: 0,
});

export const CUSTOM_SECTION_PRESETS = [
  { value: 'simpleList', label: '단순 리스트형' },
  { value: 'timeline', label: '날짜/제목/설명형' },
  { value: 'media', label: '이미지+텍스트 카드형' },
  { value: 'complex', label: '복합 프로젝트형' },
];

export const createTextBlock = () => ({
  id: uid(),
  type: 'text',
  title: '핵심 내용',
  content: '설명을 입력하세요.',
  colSpan: 12,
  rowSpan: 1,
});

export const createListBlock = () => ({
  id: uid(),
  type: 'list',
  title: '주요 항목',
  items: ['항목 1', '항목 2'],
  colSpan: 12,
  rowSpan: 1,
});

export const createImageBlock = () => ({
  id: uid(),
  type: 'image',
  title: '이미지',
  caption: '이미지 캡션',
  images: [''],
  colSpan: 6,
  rowSpan: 1,
});

export const createProject = () => ({
  id: uid(),
  title: '새 프로젝트',
  period: '2026.01 ~ 2026.03',
  role: '담당 역할',
  summary: '프로젝트 요약을 입력하세요.',
  techStack: ['React', 'Spring Boot'],
  link: 'https://github.com/',
  blocks: [
    { ...createTextBlock(), colSpan: 8, rowSpan: 1 },
    { ...createListBlock(), colSpan: 4, rowSpan: 2 },
    { ...createImageBlock(), colSpan: 8, rowSpan: 1 },
  ],
});

export const createComplexCustomItem = () => ({
  id: uid(),
  title: '새 복합 프로젝트',
  subtitle: '부제목 / 담당 역할',
  date: '2026.01 ~ 2026.03',
  summary: '복합 프로젝트 요약을 입력하세요.',
  techStack: ['React', 'Spring'],
  link: 'https://example.com',
  colSpan: 6,
  rowSpan: 1,
  blocks: [
    { ...createTextBlock(), colSpan: 8, rowSpan: 1 },
    { ...createListBlock(), colSpan: 4, rowSpan: 2 },
    { ...createImageBlock(), colSpan: 8, rowSpan: 1 },
  ],
});

export const createSkill = () => ({
  id: uid(),
  category: 'New Category',
  value: '기술을 입력하세요.',
});

export const createTimelineItem = (title = '새 항목') => ({
  id: uid(),
  date: '2026.01',
  title,
  desc: '설명을 입력하세요.',
});

export const createCustomSectionItem = (template) => {
  if (template === 'simpleList') {
    return {
      id: uid(),
      title: '새 항목',
      description: '간단한 설명',
      colSpan: 6,
      rowSpan: 1,
    };
  }

  if (template === 'timeline') {
    return {
      id: uid(),
      date: '2026.01',
      title: '새 일정',
      description: '설명을 입력하세요.',
      colSpan: 6,
      rowSpan: 1,
    };
  }

  if (template === 'media') {
    return {
      id: uid(),
      title: '새 카드',
      description: '이미지와 함께 설명을 입력하세요.',
      image: '',
      imagePosition: 'top',
      tags: ['태그'],
      colSpan: 6,
      rowSpan: 1,
    };
  }

  return createComplexCustomItem();
};

export const createCustomSection = ({
                                      name = '새 섹션',
                                      template = 'simpleList',
                                      span = 12,
                                      rowSpan = 1,
                                    } = {}) => ({
  id: uid(),
  name,
  template,
  span,
  rowSpan,
  items: [createCustomSectionItem(template)],
});

export const defaultProfileBlocks = () => [
  { key: 'image', colSpan: 3, rowSpan: 2, visible: true, label: '프로필 이미지' },
  { key: 'quote', colSpan: 9, rowSpan: 1, visible: true, label: '한 줄 메시지' },
  { key: 'contacts', colSpan: 4, rowSpan: 1, visible: true, label: '연락처' },
  { key: 'identity', colSpan: 8, rowSpan: 1, visible: true, label: '이름 / 직무' },
  { key: 'intro', colSpan: 12, rowSpan: 1, visible: true, label: '자기소개' },
];

export const defaultSectionLayout = () => [
  { key: 'profile', span: 12, rowSpan: 1, label: '프로필', kind: 'base' },
  { key: 'skills', span: 12, rowSpan: 1, label: '기술 스택', kind: 'base' },
  { key: 'projects', span: 12, rowSpan: 1, label: '프로젝트', kind: 'base' },
  { key: 'awards', span: 6, rowSpan: 1, label: '수상', kind: 'base' },
  { key: 'certificates', span: 6, rowSpan: 1, label: '자격증', kind: 'base' },
];

export const defaultPortfolio = {
  profile: {
    name: '한동균',
    role: 'Backend Developer',
    quote: '운영 가능한 품질을 끝까지 만드는 개발자',
    email: 'email@example.com',
    github: 'github.com/example',
    phone: '010-0000-0000',
    intro:
        '문제의 본질을 파악하고, 기능 구현을 넘어 운영과 유지보수까지 고려하는 개발자입니다. 프로젝트마다 구조, 예외 처리, 배포 안정성을 함께 고민해왔습니다.',
    image: '',
    layout: defaultProfileBlocks(),
  },
  skills: [
    { id: uid(), category: 'Language', value: 'Java, JavaScript, TypeScript' },
    { id: uid(), category: 'Backend', value: 'Spring Boot, JPA, MyBatis, Node.js' },
    { id: uid(), category: 'Infra', value: 'Docker, Jenkins, AWS EC2, NGINX' },
    { id: uid(), category: 'Database', value: 'MariaDB, MySQL, PostgreSQL' },
  ],
  projects: [
    {
      id: uid(),
      title: '새로고침',
      period: '2024.09 ~ 2025.06',
      role: '백엔드 / 클라우드 아키텍처',
      summary:
          '재활용 관리, 실시간 채팅, 챗봇, 구매/판매 시스템을 포함한 환경 보호 플랫폼입니다.',
      techStack: ['Spring Boot', 'MariaDB', 'Docker', 'AWS EC2', 'Jenkins'],
      link: 'https://github.com/example/refresh',
      blocks: [
        {
          id: uid(),
          type: 'text',
          title: '핵심 기여',
          content:
              'MSA 구조 설계, 운영 기준 예외 처리 정리, 배포 자동화 구조 설계를 담당했습니다.',
          colSpan: 8,
          rowSpan: 1,
        },
        {
          id: uid(),
          type: 'list',
          title: '주요 성과',
          items: ['서비스 경계 분리', 'CI/CD 파이프라인 구축', '실시간 기능 안정성 개선'],
          colSpan: 4,
          rowSpan: 2,
        },
        {
          id: uid(),
          type: 'image',
          title: '구조도 / 화면',
          caption: '메인 구조',
          images: [''],
          colSpan: 8,
          rowSpan: 1,
        },
      ],
    },
  ],
  awards: [
    { id: uid(), date: '2025.06', title: '캡스톤디자인 우수상', desc: '새로고침 프로젝트' },
  ],
  certificates: [
    { id: uid(), date: '2025.04', title: 'SQLD', desc: 'SQL 개발자' },
  ],
  customSections: [],
  layout: {
    sections: {
      profile: true,
      skills: true,
      projects: true,
      awards: true,
      certificates: true,
    },
    items: defaultSectionLayout(),
  },
  styles: {
    page: {
      baseBackgroundColor: '#ece7dc',
      backgroundColor: '#f4f1ea',
      color: '#1d1d1b',
      fontFamily: 'Noto Sans KR, sans-serif',
    },
    card: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
    },
    elements: {
      'profile.quote': {
        ...defaultStyle(),
        fontSize: 18,
        fontWeight: '800',
        borderColor: '#16a34a',
        padding: 8,
      },
      'profile.name': { ...defaultStyle(), fontSize: 44, fontWeight: '800' },
      'profile.role': {
        ...defaultStyle(),
        fontSize: 22,
        fontWeight: '700',
        color: '#16a34a',
      },
      'profile.intro': {
        ...defaultStyle(),
        fontSize: 16,
        lineHeight: 1.8,
        color: '#55514c',
      },
      'profile.contacts': {
        ...defaultStyle(),
        fontSize: 15,
        lineHeight: 1.7,
      },
      'section.projects.title': { ...defaultStyle(), fontSize: 40, fontWeight: '800' },
      'section.skills.title': { ...defaultStyle(), fontSize: 28, fontWeight: '700' },
      'section.awards.title': { ...defaultStyle(), fontSize: 28, fontWeight: '700' },
      'section.certificates.title': { ...defaultStyle(), fontSize: 28, fontWeight: '700' },
    },
  },
};