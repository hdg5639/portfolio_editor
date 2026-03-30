import { autoPlaceGridItems } from './layoutGrid.js';

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
  layoutMode: 'manual',
  blocks: autoPlaceGridItems([
    { ...createTextBlock(), colSpan: 8, rowSpan: 1 },
    { ...createListBlock(), colSpan: 4, rowSpan: 2 },
    { ...createImageBlock(), colSpan: 8, rowSpan: 1 },
  ]),
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
  layoutMode: 'manual',
  blocks: autoPlaceGridItems([
    { ...createTextBlock(), colSpan: 8, rowSpan: 1 },
    { ...createListBlock(), colSpan: 4, rowSpan: 2 },
    { ...createImageBlock(), colSpan: 8, rowSpan: 1 },
  ]),
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

export const defaultProfileBlocks = () => autoPlaceGridItems([
  { key: 'image', colSpan: 3, rowSpan: 2, visible: true, label: '프로필 이미지' },
  { key: 'quote', colSpan: 8, rowSpan: 1, visible: true, label: '한 줄 메시지' },
  { key: 'contacts', colSpan: 4, rowSpan: 1, visible: true, label: '연락처' },
  { key: 'identity', colSpan: 8, rowSpan: 1, visible: true, label: '이름 / 직무' },
  { key: 'intro', colSpan: 12, rowSpan: 1, visible: true, label: '자기소개' },
]);

export const defaultSectionLayout = () => [
  { key: 'profile', span: 12, rowSpan: 1, label: '프로필', kind: 'base' },
  { key: 'skills', span: 12, rowSpan: 1, label: '기술 스택', kind: 'base' },
  { key: 'projects', span: 12, rowSpan: 1, label: '프로젝트', kind: 'base' },
  { key: 'awards', span: 6, rowSpan: 1, label: '수상', kind: 'base' },
  { key: 'certificates', span: 6, rowSpan: 1, label: '자격증', kind: 'base' },
];

export const defaultPortfolio = {
  profile: {
    name: '김도윤',
    role: 'Full Stack Developer',
    quote: '문제를 구조로 풀고, 서비스를 끝까지 완성하는 개발자',
    email: 'doyun.kim@example.com',
    github: 'github.com/doyunkim-dev',
    phone: '010-4821-1934',
    intro:
        '사용자 경험과 운영 안정성을 함께 고려하며 서비스를 설계하는 개발자입니다. 프론트엔드와 백엔드를 넘나들며 기능 구현뿐 아니라 구조 개선, 성능 최적화, 유지보수성까지 함께 고민해왔습니다.',
    image: '',
    layoutMode: 'manual',
    layout: defaultProfileBlocks(),
  },

  skills: [
    { id: uid(), category: 'Language', value: 'TypeScript, JavaScript, Java, Python' },
    { id: uid(), category: 'Frontend', value: 'React, Next.js, Tailwind CSS, Redux Toolkit' },
    { id: uid(), category: 'Backend', value: 'Node.js, Spring Boot, Express, REST API' },
    { id: uid(), category: 'Infra / DB', value: 'Docker, AWS, PostgreSQL, Redis, GitHub Actions' },
  ],

  projects: [
    {
      id: uid(),
      title: 'TaskFlow',
      period: '2025.01 ~ 2025.04',
      role: '풀스택 개발 / 프로젝트 리드',
      summary:
          '팀 협업을 위한 일정·문서·업무 관리 플랫폼입니다. 프로젝트 보드, 댓글, 알림, 대시보드 기능을 중심으로 생산성을 높이는 서비스를 구현했습니다.',
      techStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      link: 'https://github.com/example/taskflow',
      blocks: [
        {
          id: uid(),
          type: 'text',
          title: '핵심 기여',
          content:
              '서비스 구조 설계, 인증 흐름 구현, 프로젝트 보드 및 알림 기능 개발을 주도했습니다. 공통 컴포넌트와 API 응답 구조를 정리해 개발 효율을 높였습니다.',
          colSpan: 8,
          rowSpan: 1,
        },
        {
          id: uid(),
          type: 'list',
          title: '주요 성과',
          items: [
            '칸반 보드 및 일정 기능 구현',
            '실시간 알림 UX 개선',
            '공통 API/컴포넌트 구조 정리',
          ],
          colSpan: 4,
          rowSpan: 2,
        },
        {
          id: uid(),
          type: 'image',
          title: '서비스 화면',
          caption: '대시보드 및 프로젝트 보드',
          images: [''],
          colSpan: 8,
          rowSpan: 1,
        },
      ],
    },
    {
      id: uid(),
      title: 'DevArchive',
      period: '2024.08 ~ 2024.12',
      role: '백엔드 개발',
      summary:
          '기술 문서와 회고를 아카이빙하고 검색할 수 있는 개발자 기록 플랫폼입니다. 태그 기반 분류와 검색 최적화를 통해 정보 탐색성을 높였습니다.',
      techStack: ['Spring Boot', 'JPA', 'MySQL', 'Redis', 'AWS EC2'],
      link: 'https://github.com/example/devarchive',
      blocks: [
        {
          id: uid(),
          type: 'text',
          title: '핵심 기여',
          content:
              '문서 CRUD, 태그 시스템, 검색 API, 캐시 전략을 구현했습니다. 데이터 조회 패턴을 분석해 반복 요청이 많은 구간을 개선했습니다.',
          colSpan: 8,
          rowSpan: 1,
        },
        {
          id: uid(),
          type: 'list',
          title: '주요 성과',
          items: [
            '태그 기반 검색 기능 구현',
            '조회 성능 개선용 캐시 적용',
            '배포 환경 구성 및 운영',
          ],
          colSpan: 4,
          rowSpan: 2,
        },
        {
          id: uid(),
          type: 'image',
          title: '아키텍처 / 화면',
          caption: '문서 상세 및 검색 화면',
          images: [''],
          colSpan: 8,
          rowSpan: 1,
        },
      ],
    },
  ],

  awards: [
    { id: uid(), date: '2025.11', title: '해커톤 우수상', desc: '협업 생산성 플랫폼 TaskFlow' },
    { id: uid(), date: '2024.12', title: '캡스톤 프로젝트 장려상', desc: 'DevArchive 프로젝트' },
  ],

  certificates: [
    { id: uid(), date: '2025.05', title: 'SQLD', desc: 'SQL 개발자' },
    { id: uid(), date: '2024.09', title: '정보처리기사', desc: '필기 합격 / 실기 준비' },
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
      backgroundColor: '#f4f1ea',
      baseBackgroundColor: '#ece7dc',
      color: '#1d1d1b',
      fontFamily: 'Noto Sans KR, sans-serif',
      widthMode: 'fixed',
      fixedWidth: 980,
      customWidth: 1280,
      orientation: 'portrait',
    },
    profileCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    projectsCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    skillsCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    awardsCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    certificatesCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    customCard: {
      backgroundColor: '#ffffff',
      borderColor: '#e8e1d7',
      borderRadius: 24,
      padding: 28,
      shadowEnabled: true,
      shadowAngle: 'bottom-right',
      shadowOpacity: 10,
      shadowLength: 28,
    },
    elements: {
      'profile.quote': {
        fontSize: 18,
        fontWeight: '800',
        borderColor: '#16a34a',
        padding: 8,
      },
      'profile.name': { fontSize: 44, fontWeight: '800' },
      'profile.role': {
        fontSize: 22,
        fontWeight: '700',
        color: '#16a34a',
      },
      'profile.intro': {
        fontSize: 16,
        lineHeight: 1.8,
        color: '#55514c',
      },
      'profile.contacts': {
        fontSize: 15,
        lineHeight: 1.7,
      },
      'section.profile.title': { fontSize: 32, fontWeight: '800', letterSpacing: -0.48 },
      'section.projects.title': { fontSize: 40, fontWeight: '800' },
      'section.skills.title': { fontSize: 28, fontWeight: '700' },
      'section.awards.title': { fontSize: 28, fontWeight: '700' },
      'section.certificates.title': { fontSize: 28, fontWeight: '700' },
    },
  },
};