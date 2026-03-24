import { useState } from 'react';
import PanelSection from './PanelSection';
import { CUSTOM_SECTION_PRESETS } from '../utils/defaultPortfolio';

function SectionToggles({ sections, labels, actions }) {
    return (
        <div className="toggle-grid">
            {Object.entries(sections).map(([key, value]) => (
                <button
                    key={key}
                    type="button"
                    className={`toggle-chip ${value ? 'active' : ''}`}
                    onClick={() => actions.toggleSection(key)}
                >
                    {labels[key] || key}
                </button>
            ))}
        </div>
    );
}

function ComplexSectionDetail({ section, actions }) {
    return (
        <details className="custom-section-detail" open={false}>
            <summary>복합 프로젝트형 상세 설정</summary>
            <div className="custom-section-detail-body">
                {(section.items || []).map((item, index) => (
                    <details key={item.id} className="custom-section-subdetail" open={index === 0}>
                        <summary>{item.title || `아이템 ${index + 1}`}</summary>

                        <div className="builder-form">
                            <label className="builder-field">
                                <span>제목</span>
                                <input
                                    value={item.title || ''}
                                    onChange={(e) => actions.updateCustomSectionItem(section.id, item.id, 'title', e.target.value)}
                                />
                            </label>

                            <label className="builder-field">
                                <span>부제목 / 역할</span>
                                <input
                                    value={item.subtitle || ''}
                                    onChange={(e) => actions.updateCustomSectionItem(section.id, item.id, 'subtitle', e.target.value)}
                                />
                            </label>

                            <label className="builder-field">
                                <span>기간 / 날짜</span>
                                <input
                                    value={item.date || ''}
                                    onChange={(e) => actions.updateCustomSectionItem(section.id, item.id, 'date', e.target.value)}
                                />
                            </label>

                            <label className="builder-field">
                                <span>요약</span>
                                <textarea
                                    value={item.summary || ''}
                                    onChange={(e) => actions.updateCustomSectionItem(section.id, item.id, 'summary', e.target.value)}
                                />
                            </label>

                            <label className="builder-field">
                                <span>링크</span>
                                <input
                                    value={item.link || ''}
                                    onChange={(e) => actions.updateCustomSectionItem(section.id, item.id, 'link', e.target.value)}
                                />
                            </label>

                            <label className="builder-field">
                                <span>가로 폭</span>
                                <select
                                    value={item.colSpan || 6}
                                    onChange={(e) => actions.setCustomSectionItemSpan(section.id, item.id, Number(e.target.value))}
                                >
                                    <option value={12}>12</option>
                                    <option value={8}>8</option>
                                    <option value={6}>6</option>
                                    <option value={4}>4</option>
                                    <option value={3}>3</option>
                                </select>
                            </label>

                            <label className="builder-field">
                                <span>세로 높이</span>
                                <select
                                    value={item.rowSpan || 1}
                                    onChange={(e) => actions.setCustomSectionItemRowSpan(section.id, item.id, Number(e.target.value))}
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                </select>
                            </label>

                            <div className="row wrap gap-sm">
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addCustomComplexBlock(section.id, item.id, 'text')}
                                >
                                    텍스트 블록
                                </button>
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addCustomComplexBlock(section.id, item.id, 'list')}
                                >
                                    리스트 블록
                                </button>
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addCustomComplexBlock(section.id, item.id, 'image')}
                                >
                                    이미지 블록
                                </button>
                            </div>
                        </div>

                        <div className="builder-form" style={{ marginTop: 12 }}>
                            <span className="builder-field">
                                <span>기술 스택</span>
                            </span>
                            {(item.techStack || []).map((tech, techIndex) => (
                                <input
                                    key={`${item.id}-tech-${techIndex}`}
                                    value={tech}
                                    onChange={(e) =>
                                        actions.updateCustomComplexTech(section.id, item.id, techIndex, e.target.value)
                                    }
                                />
                            ))}
                            <button
                                type="button"
                                className="ghost small"
                                onClick={() => actions.addCustomComplexTech(section.id, item.id)}
                            >
                                기술 추가
                            </button>
                        </div>

                        <div className="sub-list" style={{ marginTop: 12 }}>
                            {(item.blocks || []).map((block) => (
                                <div className="sub-item" key={block.id}>
                                    <span>{block.type} · {block.title || '무제 블록'}</span>
                                    <button
                                        type="button"
                                        className="ghost danger small"
                                        onClick={() => actions.removeCustomComplexBlock(section.id, item.id, block.id)}
                                    >
                                        제거
                                    </button>
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
        </details>
    );
}

export default function SidePanel({ store }) {
    const { portfolio, actions } = store;
    const [customName, setCustomName] = useState('');
    const [customTemplate, setCustomTemplate] = useState('simpleList');
    const [customSpan, setCustomSpan] = useState(12);
    const [customRowSpan, setCustomRowSpan] = useState(1);

    const sectionLabels = portfolio.layout.items.reduce((acc, item) => {
        acc[item.key] = item.label;
        return acc;
    }, {});

    return (
        <div className="panel-stack side-panel-shell">
            <PanelSection title="섹션 노출" collapsible defaultOpen>
                <SectionToggles sections={portfolio.layout.sections} labels={sectionLabels} actions={actions} />
            </PanelSection>

            <PanelSection title="커스텀 섹션 생성" collapsible defaultOpen>
                <div className="builder-form">
                    <label className="builder-field">
                        <span>섹션 이름</span>
                        <input
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="예: 활동 내역"
                        />
                    </label>

                    <label className="builder-field">
                        <span>구조</span>
                        <select value={customTemplate} onChange={(e) => setCustomTemplate(e.target.value)}>
                            {CUSTOM_SECTION_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                    {preset.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="builder-field">
                        <span>가로 폭</span>
                        <select value={customSpan} onChange={(e) => setCustomSpan(Number(e.target.value))}>
                            <option value={12}>12</option>
                            <option value={8}>8</option>
                            <option value={6}>6</option>
                            <option value={4}>4</option>
                            <option value={3}>3</option>
                        </select>
                    </label>

                    <label className="builder-field">
                        <span>세로 높이</span>
                        <select value={customRowSpan} onChange={(e) => setCustomRowSpan(Number(e.target.value))}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={() => {
                            actions.addCustomSection({
                                name: customName || '새 섹션',
                                template: customTemplate,
                                span: customSpan,
                                rowSpan: customRowSpan,
                            });
                            setCustomName('');
                            setCustomTemplate('simpleList');
                            setCustomSpan(12);
                            setCustomRowSpan(1);
                        }}
                    >
                        섹션 추가
                    </button>
                </div>
            </PanelSection>

            <PanelSection title="커스텀 섹션 관리" collapsible defaultOpen={false}>
                <div className="mini-list">
                    {(portfolio.customSections || []).map((section) => (
                        <div className="mini-card column" key={section.id}>
                            <div className="row between start">
                                <div>
                                    <strong>{section.name}</strong>
                                    <p>{section.template}</p>
                                </div>
                                <button
                                    type="button"
                                    className="ghost danger"
                                    onClick={() => actions.removeCustomSection(section.id)}
                                >
                                    삭제
                                </button>
                            </div>

                            <div className="builder-form">
                                <label className="builder-field">
                                    <span>이름</span>
                                    <input
                                        value={section.name}
                                        onChange={(e) =>
                                            actions.updateCustomSectionMeta(section.id, 'name', e.target.value)
                                        }
                                    />
                                </label>

                                <label className="builder-field">
                                    <span>템플릿</span>
                                    <select
                                        value={section.template}
                                        onChange={(e) =>
                                            actions.updateCustomSectionMeta(section.id, 'template', e.target.value)
                                        }
                                    >
                                        {CUSTOM_SECTION_PRESETS.map((preset) => (
                                            <option key={preset.value} value={preset.value}>
                                                {preset.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="builder-field">
                                    <span>가로 폭</span>
                                    <select
                                        value={section.span}
                                        onChange={(e) =>
                                            actions.updateCustomSectionMeta(section.id, 'span', Number(e.target.value))
                                        }
                                    >
                                        <option value={12}>12</option>
                                        <option value={8}>8</option>
                                        <option value={6}>6</option>
                                        <option value={4}>4</option>
                                        <option value={3}>3</option>
                                    </select>
                                </label>

                                <label className="builder-field">
                                    <span>세로 높이</span>
                                    <select
                                        value={section.rowSpan || 1}
                                        onChange={(e) =>
                                            actions.updateCustomSectionMeta(
                                                section.id,
                                                'rowSpan',
                                                Number(e.target.value)
                                            )
                                        }
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addCustomSectionItem(section.id)}
                                >
                                    항목 추가
                                </button>
                            </div>

                            {section.template === 'complex' ? (
                                <ComplexSectionDetail section={section} actions={actions} />
                            ) : null}
                        </div>
                    ))}
                </div>
            </PanelSection>

            <PanelSection
                title="기술 스택"
                action={
                    <button type="button" onClick={actions.addSkill}>
                        추가
                    </button>
                }
                collapsible
                defaultOpen={false}
            >
                <div className="mini-list">
                    {portfolio.skills.map((skill) => (
                        <div className="mini-card" key={skill.id}>
                            <div>
                                <strong>{skill.category || '새 기술'}</strong>
                                <p>{skill.value || '내용 없음'}</p>
                            </div>
                            <button
                                type="button"
                                className="ghost danger"
                                onClick={() => actions.removeSkill(skill.id)}
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            </PanelSection>

            <PanelSection
                title="프로젝트"
                action={
                    <button type="button" onClick={actions.addProject}>
                        추가
                    </button>
                }
                collapsible
                defaultOpen={false}
            >
                <div className="mini-list">
                    {portfolio.projects.map((project) => (
                        <div className="mini-card column" key={project.id}>
                            <div className="row between start">
                                <div>
                                    <strong>{project.title || '새 프로젝트'}</strong>
                                    <p>{project.period}</p>
                                </div>
                                <button
                                    type="button"
                                    className="ghost danger"
                                    onClick={() => actions.removeProject(project.id)}
                                >
                                    삭제
                                </button>
                            </div>

                            <div className="row wrap gap-sm">
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addProjectBlock(project.id, 'text')}
                                >
                                    텍스트 블록
                                </button>
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addProjectBlock(project.id, 'list')}
                                >
                                    리스트 블록
                                </button>
                                <button
                                    type="button"
                                    className="ghost small"
                                    onClick={() => actions.addProjectBlock(project.id, 'image')}
                                >
                                    이미지 블록
                                </button>
                            </div>

                            <div className="sub-list">
                                {project.blocks.map((block) => (
                                    <div className="sub-item" key={block.id}>
                                        <span>
                                            {block.type} · {block.title || '무제 블록'}
                                        </span>
                                        <button
                                            type="button"
                                            className="ghost danger small"
                                            onClick={() => actions.removeProjectBlock(project.id, block.id)}
                                        >
                                            제거
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </PanelSection>
        </div>
    );
}