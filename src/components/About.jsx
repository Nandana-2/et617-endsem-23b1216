
export default function About() {
  const details = [
    {
      code: 'P4',
      title: 'Adaptive Tutor',
      description:
        'An intelligent learning experience that adapts questions to the learner’s performance.',
    },
    {
      code: 'T7',
      title: 'Simple Past vs Present Perfect',
      description:
        'Focused practice on understanding the difference between these two important English tenses.',
    },
    {
      code: 'L6',
      title: 'Olympiad Learner',
      description:
        'Designed for Class 9 students preparing for English Olympiad challenges.',
    },
    {
      code: 'C4',
      title: '10-Minute Sessions',
      description:
        'Short, focused practice sessions with a countdown timer and automatically saved progress.',
    },
  ];

  return (
    <section className="about-screen screen-state">
      <p className="eyebrow">ABOUT THE PROJECT</p>

      <h1 className="about-title">
        Learn smarter.
        <span> Improve every session.</span>
      </h1>

      <p className="about-description">
        Adaptive English Tenses Tutor is an interactive learning
        application that helps Class 9 Olympiad learners understand
        and practise the difference between the simple past and
        present perfect tenses.
      </p>

      <div className="about-card">
        <div className="about-card-heading">
          <div>
            <span className="about-card-label">PROJECT PROFILE</span>
            <h2>Learning at a glance</h2>
          </div>
          <span className="about-card-icon" aria-hidden="true">
            ✦
          </span>
        </div>

        <div className="about-details">
          {details.map((item) => (
            <article className="about-detail" key={item.code}>
              <span className="about-code">{item.code}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="about-identity">
        <span>PROJECT IDENTITY TOKEN</span>
        <strong>23B1216</strong>
      </div>
    </section>
  );
}
