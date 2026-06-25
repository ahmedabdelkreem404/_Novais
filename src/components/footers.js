import React from 'react';
import Logo from '../res/img/logo.svg';
import DarkLogo from '../res/img/logo.svg';
import axios from 'axios';
import { company, websiteURL, serverURL } from '../constants';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaGithub, FaWhatsapp, FaGlobe } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footers = () => {
  const { t } = useTranslation();
  const storedTheme = localStorage.getItem('darkMode');
  const navigate = useNavigate();

  const companyLinks = [
    { name: t('nav.about'), action: () => navigate("/about") },
    { name: t('nav.blog'), action: () => navigate("/blog") },
    { name: t('nav.contact'), action: () => navigate("/contact") },
  ];

  const resourcesLinks = [
    { name: t('footer.cancellation'), action: () => navigate("/cancellation") },
    { name: t('footer.refund'), action: () => navigate("/refund") },
    { name: t('footer.billing'), action: () => navigate("/billing") },
  ];

  const isDark = storedTheme === 'true';

  const [socialLinks, setSocialLinks] = React.useState([]);

  React.useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await axios.get(`${serverURL}/social-links`);
        setSocialLinks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch social links", error);
      }
    };
    fetchSocials();
  }, []);

  const getSocialIcon = (platform) => {
    const p = platform ? platform.toLowerCase() : '';
    if (p.includes('facebook')) return <FaFacebookF />;
    if (p.includes('twitter') || p.includes('x')) return <FaTwitter />;
    if (p.includes('linkedin')) return <FaLinkedinIn />;
    if (p.includes('instagram')) return <FaInstagram />;
    if (p.includes('whatsapp')) return <FaWhatsapp />;
    if (p.includes('github') || p.includes('git')) return <FaGithub />;
    return <FaGlobe />;
  };

  return (
    <footer className="public-footer">
      <div className="app-container public-footer__inner">
        <div className="public-footer__top">
          <div className="public-footer__brand">
            <a className="public-footer__brandLink" href={websiteURL}>
              <img className="public-footer__logo" src={isDark ? DarkLogo : Logo} alt="Logo" />
              <span className="public-footer__name">NOVAIS</span>
            </a>
            <p className="public-footer__tagline">
              {t('landing.subtitle').split('.')[0] + '.'}
            </p>
            <div className="public-footer__socials">
              {(Array.isArray(socialLinks) ? socialLinks : []).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-footer__social"
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          <div className="public-footer__cols">
            <div className="public-footer__col">
              <div className="public-footer__colTitle">{t('footer.company')}</div>
              <div className="public-footer__links" aria-label="Company">
                {companyLinks.map((link) => (
                  <button
                    type="button"
                    className="public-footer__link"
                    key={link.name}
                    onClick={link.action}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="public-footer__col">
              <div className="public-footer__colTitle">{t('footer.resources')}</div>
              <div className="public-footer__links" aria-label="Resources">
                {resourcesLinks.map((link) => (
                  <button
                    type="button"
                    className="public-footer__link"
                    key={link.name}
                    onClick={link.action}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="public-footer__bottom">
          <p className="public-footer__legal">© 2026 {company}. {t('common.all_rights_reserved')}</p>
          <div className="public-footer__legalLinks">
            <button type="button" className="public-footer__legalLink" onClick={() => navigate('/privacy')}>{t('footer.privacy')}</button>
            <button type="button" className="public-footer__legalLink" onClick={() => navigate('/terms')}>{t('footer.terms')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footers;
