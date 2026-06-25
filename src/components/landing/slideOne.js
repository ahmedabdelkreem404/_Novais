import React from 'react';
import slide from '../../res/img/slideOne.png'
import { useNavigate } from "react-router-dom";

const SlideOne = () => {

    const navigate = useNavigate();

    function redirectSignIn() {
        navigate("/signin");
    }
    function redirectSignUp() {
        navigate("/signup");
    }


    return (
        <div>

            <h1>Ai Course Generator</h1>

            <p>
                Revolutionize your learning journey with our AI Course Generator SaaS
                Effortlessly create engaging and personalized courses tailored to your needs
            </p>

            <div>
                <button
                    onClick={redirectSignIn}>
                    Sign In
                </button>
                <button
                    onClick={redirectSignUp}>
                    Get Started Free
                </button>
            </div>

            <img
                src={slide}
                alt="Your Alt Text"
                
            />
        </div>
    );
};

export default SlideOne;
