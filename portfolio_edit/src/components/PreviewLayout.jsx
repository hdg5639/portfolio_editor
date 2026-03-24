import ProfileSection from '../sections/ProfileSection';
import SkillSection from '../sections/SkillSection';
import TimelineSection from '../sections/TimelineSection';
import ProjectCard from '../sections/ProjectCard';

export default function PreviewLayout({ portfolio }) {
  const { profile, skills, projects, awards, certificates, theme } = portfolio;

  return (
    <main className="preview-page">
      <ProfileSection profile={profile} accent={theme.accent} />
      <SkillSection skills={skills} />

      <section className="preview-section-group">
        <div className="section-header-line">
          <h3>프로젝트</h3>
        </div>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} accent={theme.accent} />
        ))}
      </section>

      <div className="two-column-grid">
        <TimelineSection title="수상" items={awards} />
        <TimelineSection title="자격증" items={certificates} />
      </div>
    </main>
  );
}
