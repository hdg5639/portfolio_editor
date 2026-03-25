import { useMemo, useState } from 'react';
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

function MobileLayoutIntro({ title, desc }) {
    return (
        <section className="panel-section mobile-layout-intro">
            <div className="panel-section-body mobile-layout-intro-body">
                <strong>{title}</strong>
                <p>{desc}</p>
            </div>
        </section>
    );
}

function LayoutSectionPanel({ portfolio, sectionLabels, actions }) {
    const visibleCount = Object.values(portfolio.layout?.sections || {}).filter(Boolean).length;

    return (
        <>
            <MobileLayoutIntro
                title="섹션 표시 관리"
                desc={`현재 ${visibleCount}개의 섹션이 보입니다. 원하는 섹션만 바로 켜고 끌 수 있습니다.`}
            />

            <PanelSection title="표시 토글" collapsible defaultOpen>
                <SectionToggles
                    sections={portfolio.layout?.sections || {}}
                    labels={sectionLabels}
                    actions={actions}
                />
            </PanelSection>
        </>
    );
}

function LayoutCustomPanel({ portfolio, actions, newSectionPreset, setNewSectionPreset }) {
    return (
        <>
            <MobileLayoutIntro
                title="커스텀 섹션"
                desc="새 섹션을 추가하고 이름, 템플릿, 크기를 모바일에서 바로 조정합니다."
            />

            <PanelSection
                title="새 커스텀 섹션 추가"
                action={
                    <button
                        type="button"
                        onClick={() =>
                            actions.addCustomSection({
                                name: '새 커스텀 섹션',
                                template: newSectionPreset,
                                span: 12,
                                rowSpan: 1,
                            })
                        }
                    >
                        추가
                    </button>
                }
            >
                <div className="builder-form">
                    <label className="builder-field">
                        <span>템플릿</span>
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
                    </label>
                </div>
            </PanelSection>

            <PanelSection
                title={`생성된 섹션 ${portfolio.customSections.length}개`}
                collapsible
                defaultOpen
            >
                <div className="mini-list">
                    {portfolio.customSections.length ? (
                        portfolio.customSections.map((section) => (
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

                                    <div className="mobile-two-col-grid">
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
                                    </div>

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
                        ))
                    ) : (
                        <div className="mobile-empty-state">
                            아직 커스텀 섹션이 없습니다.
                        </div>
                    )}
                </div>
            </PanelSection>
        </>
    );
}

function LayoutSkillsPanel({ portfolio, actions }) {
    return (
        <>
            <MobileLayoutIntro
                title="기술 스택 관리"
                desc="기술 카테고리를 빠르게 추가하거나 필요 없는 항목을 정리합니다."
            />

            <PanelSection
                title={`기술 항목 ${portfolio.skills.length}개`}
                action={
                    <button type="button" onClick={actions.addSkill}>
                        추가
                    </button>
                }
                collapsible
                defaultOpen
            >
                <div className="mini-list">
                    {portfolio.skills.map((skill) => (
                        <div className="mini-card column" key={skill.id}>
                            <div className="row between start">
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

                            <div className="builder-form">
                                <label className="builder-field">
                                    <span>카테고리</span>
                                    <input
                                        value={skill.category || ''}
                                        onChange={(e) =>
                                            actions.updateSkill(skill.id, 'category', e.target.value)
                                        }
                                    />
                                </label>

                                <label className="builder-field">
                                    <span>내용</span>
                                    <textarea
                                        rows={3}
                                        value={skill.value || ''}
                                        onChange={(e) =>
                                            actions.updateSkill(skill.id, 'value', e.target.value)
                                        }
                                    />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </PanelSection>
        </>
    );
}

function LayoutProjectsPanel({ portfolio, actions }) {
    return (
        <>
            <MobileLayoutIntro
                title="프로젝트 구성"
                desc="프로젝트를 추가하고, 각 프로젝트에 텍스트 / 리스트 / 이미지 블록을 바로 붙일 수 있습니다."
            />

            <PanelSection
                title={`프로젝트 ${portfolio.projects.length}개`}
                action={
                    <button type="button" onClick={actions.addProject}>
                        추가
                    </button>
                }
                collapsible
                defaultOpen
            >
                <div className="mini-list">
                    {portfolio.projects.map((project) => (
                        <div className="mini-card column" key={project.id}>
                            <div className="row between start">
                                <div>
                                    <strong>{project.title || '새 프로젝트'}</strong>
                                    <p>{project.period || '기간 없음'}</p>
                                </div>
                                <button
                                    type="button"
                                    className="ghost danger"
                                    onClick={() => actions.removeProject(project.id)}
                                >
                                    삭제
                                </button>
                            </div>

                            <div className="builder-form">
                                <label className="builder-field">
                                    <span>프로젝트명</span>
                                    <input
                                        value={project.title || ''}
                                        onChange={(e) =>
                                            actions.updateProject(project.id, 'title', e.target.value)
                                        }
                                    />
                                </label>

                                <label className="builder-field">
                                    <span>기간</span>
                                    <input
                                        value={project.period || ''}
                                        onChange={(e) =>
                                            actions.updateProject(project.id, 'period', e.target.value)
                                        }
                                    />
                                </label>
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
        </>
    );
}

function LayoutRotatePanel({ portfolio, actions }) {
    const isLandscape = portfolio.styles.page?.orientation === 'landscape';

    return (
        <>
            <MobileLayoutIntro
                title="페이지 방향"
                desc="모바일에서도 포트폴리오 페이지를 세로형 / 가로형으로 바로 전환합니다."
            />

            <PanelSection title="방향 전환" collapsible defaultOpen>
                <div className="orientation-picker">
                    <button
                        type="button"
                        className={`orientation-card ${!isLandscape ? 'active' : ''}`}
                        onClick={() => actions.setPageOrientation('portrait')}
                    >
                        <span className="orientation-card-preview portrait" />
                        <strong>세로형</strong>
                        <p>A4 Portrait</p>
                    </button>

                    <button
                        type="button"
                        className={`orientation-card ${isLandscape ? 'active' : ''}`}
                        onClick={() => actions.setPageOrientation('landscape')}
                    >
                        <span className="orientation-card-preview landscape" />
                        <strong>가로형</strong>
                        <p>A4 Landscape</p>
                    </button>
                </div>

                <button
                    type="button"
                    className="orientation-toggle-button"
                    onClick={actions.togglePageOrientation}
                >
                    현재 방향 빠르게 전환
                </button>
            </PanelSection>
        </>
    );
}

function renderEmbeddedMobileLayoutTool({
                                            tool,
                                            portfolio,
                                            actions,
                                            sectionLabels,
                                            newSectionPreset,
                                            setNewSectionPreset,
                                        }) {
    switch (tool) {
        case 'sections':
            return (
                <LayoutSectionPanel
                    portfolio={portfolio}
                    sectionLabels={sectionLabels}
                    actions={actions}
                />
            );
        case 'custom':
            return (
                <LayoutCustomPanel
                    portfolio={portfolio}
                    actions={actions}
                    newSectionPreset={newSectionPreset}
                    setNewSectionPreset={setNewSectionPreset}
                />
            );
        case 'skills':
            return <LayoutSkillsPanel portfolio={portfolio} actions={actions} />;
        case 'projects':
            return <LayoutProjectsPanel portfolio={portfolio} actions={actions} />;
        case 'rotate':
            return <LayoutRotatePanel portfolio={portfolio} actions={actions} />;
        default:
            return null;
    }
}

export default function SidePanel({ store, mobileTool = null, embedded = false }) {
    const { portfolio, actions, ui } = store;
    const [newSectionPreset, setNewSectionPreset] = useState('simpleList');

    const sectionLabels = useMemo(
        () => Object.fromEntries((portfolio.layout?.items || []).map((item) => [item.key, item.label])),
        [portfolio.layout?.items]
    );

    const isEmbeddedMobileTool = embedded && mobileTool;

    if (isEmbeddedMobileTool) {
        return (
            <div className="sidebar-panel side-panel-shell embedded-panel-shell">
                <div className="sidebar-panel-body">
                    <div className="panel-stack">
                        {renderEmbeddedMobileLayoutTool({
                            tool: mobileTool,
                            portfolio,
                            actions,
                            sectionLabels,
                            newSectionPreset,
                            setNewSectionPreset,
                        })}
                    </div>
                </div>
            </div>
        );
    }

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
                                    onClick={() =>
                                        actions.addCustomSection({
                                            name: '새 커스텀 섹션',
                                            template: newSectionPreset,
                                            span: 12,
                                            rowSpan: 1,
                                        })
                                    }
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