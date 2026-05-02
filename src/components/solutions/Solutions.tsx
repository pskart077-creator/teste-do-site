import Image from "next/image";

export default function Solutions() {
  const proofAvatarImages = [
    "/assets/img/solutions/people/people-01.png",
    "/assets/img/solutions/people/people-02.png",
    "/assets/img/solutions/people/people-03.png",
    "/assets/img/solutions/people/people-04.png",
    "/assets/img/solutions/people/people-05.png",
  ];

  return (
    <section id="soluções" className="solutions-section section-anchor">
      <div className="solutions-layout">
        <div className="solutions-visual">
          <Image
            src="/assets/img/solutions/global.png"
            alt="Credpagos conectando pessoas e empresas a soluções de crédito"
            width={779}
            height={744}
          />
        </div>

        <div className="solutions-content">
          <p className="solutions-eyebrow">CRÉDITO COM ORIENTAÇÃO</p>

          <h2 className="solutions-title">
            Soluções de crédito para diferentes perfis e momentos financeiros.
          </h2>

          <p className="solutions-description">
            A Credpagos facilita o acesso ao empréstimo para MEI, PJ e PF com
            uma jornada mais simples, segura e transparente, sempre sujeita à
            análise de crédito.
          </p>

          <div className="solutions-proof">
            <div className="solutions-proof-avatars" aria-hidden="true">
              {proofAvatarImages.map((avatarSrc) => (
                <Image
                  key={avatarSrc}
                  className="solutions-proof-avatar"
                  src={avatarSrc}
                  alt=""
                  width={48}
                  height={48}
                />
              ))}
              <span className="solutions-proof-badge">MEI</span>
              <span className="solutions-proof-badge">PJ</span>
              <span className="solutions-proof-badge">PF</span>
            </div>

            <p className="solutions-proof-text">
              Aprovação mediante avaliação, com condições conforme perfil.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
