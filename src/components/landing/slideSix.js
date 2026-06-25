import React from 'react';
import { useNavigate } from "react-router-dom";

const SlideSix = () => {

    const navigate = useNavigate();

    function redirectSignIn() {
        navigate("/signin");
    }
    function redirectSignUp() {
        navigate("/signup");
    }

    return (
        <div>
            <div>
                <div>
                    <h2>Get Started</h2>
                    <p>
                        Embark on your learning journey with simplicity Get Started Today.
                    </p>
                </div>
                <div>
                    <p
                        onClick={redirectSignIn}>

                        SignIn
                    </p>
                    <p
                        onClick={redirectSignUp}>
                        SignUp

                    </p>

                </div>
            </div>
        </div>
    );
};

export default SlideSix;
