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
                                    onChange={(e) =>
                                        actions.updateCustomSectionItem(section.id, item.id, 'title', e.target.value)
                                    }
                                />
                            </label>

                            <label className="builder-field">
                                <span>부제목 / 역할</span>
                                <input
                                    value={item.subtitle || ''}
                                    onChange={(e) =>
                                        actions.updateCustomSectionItem(section.id, item.id, 'subtitle', e.target.value)
                                    }
                                />
                            </label>

                            <label className="builder-field">
                                <span>기간 / 날짜</span>
                                <input
                                    value={item.date || ''}
                                    onChange={(e) =>
                                        actions.updateCustomSectionItem(section.id, item.id, 'date', e.target.value)
                                    }
                                />
                            </label>

                            <label className="builder-field">
                                <span>설명</span>
                                <textarea
                                    rows={4}
                                    value={item.description || ''}
                                    onChange={(e) =>
                                        actions.updateCustomSectionItem(
                                            section.id,
                                            item.id,
                                            'description',
                                            e.target.value
                                        )
                                    }
                                />
                            </label>

                            <label className="builder-field">
                                <span>이미지 URL</span>
                                <input
                                    value={item.image || ''}
                                    onChange={(e) =>
                                        actions.updateCustomSectionItem(section.id, item.id, 'image', e.target.value)
                                    }
                                />
                            </label>

                            <button
                                type="button"
                                className="ghost danger small"
                                onClick={() => actions.removeCustomSectionItem(section.id, item.id)}
                            >
                                아이템 삭제
                            </button>
                        </div>
                    </details>
                ))}
            </div>
        </details>
    );
}

export default function SidePanel({ store }) {
    const { portfolio, actions, ui } = store;
    const [newSectionPreset, setNewSectionPreset] = useState('text');

    const sectionLabels = Object.fromEntries(
        (portfolio.layout?.items || []).map((item) => [item.key, item.label])
    );

    return (
        <div className="sidebar-panel side-panel-shell">
            <div className="sidebar-panel-header">
                <div className="sidebar-panel-header-text">
                    <strong>구성 편집</strong>
                    <p>섹션과 프로젝트 구성을 관리합니다.</p>
                </div>

                <button
                    type="button"
                    className={`header-inline-toggle ${ui.showEditHelpers ? 'active' : ''}`}
                    onClick={actions.toggleEditHelpers}
                    aria-pressed={ui.showEditHelpers}
                    title="배치 핸들 표시 토글"
                >
                    <span className="header-inline-toggle-label">배치</span>
                    <span className="header-inline-toggle-track">
                        <span className="header-inline-toggle-thumb" />
                    </span>
                </button>
            </div>

            <div className="sidebar-panel-body">
                <div className="panel-stack">
                    <PanelSection title="섹션 표시" collapsible defaultOpen>
                        <SectionToggles
                            sections={portfolio.layout?.sections || {}}
                            labels={sectionLabels}
                            actions={actions}
                        />
                    </PanelSection>

                    <PanelSection
                        title="커스텀 섹션"
                        action={
                            <div className="row wrap gap-sm">
                                <select
                                    value={newSectionPreset}
                                    onChange={(e) => setNewSectionPreset(e.target.value)}
                                >
                                    {CUSTOM_SECTION_PRESETS.map((preset) => (
                                        <option key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => actions.addCustomSection(newSectionPreset)}
                                >
                                    추가
                                </button>
                            </div>
                        }
                        collapsible
                        defaultOpen
                    >
                        <div className="mini-list">
                            {portfolio.customSections.map((section) => (
                                <div className="mini-card column" key={section.id}>
                                    <div className="row between start">
                                        <div>
                                            <strong>{section.name || '새 커스텀 섹션'}</strong>
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
                                                    actions.updateCustomSectionMeta(
                                                        section.id,
                                                        'name',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className="builder-field">
                                            <span>템플릿</span>
                                            <select
                                                value={section.template}
                                                onChange={(e) =>
                                                    actions.updateCustomSectionMeta(
                                                        section.id,
                                                        'template',
                                                        e.target.value
                                                    )
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
                                                    actions.updateCustomSectionMeta(
                                                        section.id,
                                                        'span',
                                                        Number(e.target.value)
                                                    )
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
                                                    onClick={() =>
                                                        actions.removeProjectBlock(project.id, block.id)
                                                    }
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
            </div>
        </div>
    );
}