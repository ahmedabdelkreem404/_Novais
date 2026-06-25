import logoImg from './res/img/logo.png';
export const name = 'NOVAIS';
export const company = 'Inolty';
const getBaseURL = () => {
    if (process.env.NODE_ENV === 'development') return 'http://localhost:8000';
    return window.location.origin;
};

export const websiteURL = getBaseURL();
export const serverURL = `${getBaseURL()}/api`;
export const logo = logoImg;
export const razorpayEnabled = true;
export const paypalEnabled = true;

//PRICING :-

//FREE 
export const FreeType = 'Free Plan';
export const FreeCost = 0;
export const FreeTime = '';

//MONTHLY 
export const MonthType = 'Monthly Plan';
export const MonthCost = 9;
export const MonthTime = 'month';

//YEARLY 
export const YearType = 'Yearly Plan';
export const YearCost = 99;
export const YearTime = 'year';

//TESTIMONIAL
export const review = "The AI Course Generator revolutionized my content creation process, providing accurate and relevant topics effortlessly. It's a time-saving powerhouse that enhances the quality and relevance of my courses. A must-have tool for educators seeking efficiency and impactful online learning experiences.";
export const from = "Anam Meena Sharif";
export const profession = 'CFO at Inolty';
export const photoURL = 'https://play-lh.googleusercontent.com/sV_ffBmBJt_je4RZHnfaCfcnL-Hy6C14Iol7H5EMj9fzI2GDOonuojdn5t9p6n9IAX8j';
