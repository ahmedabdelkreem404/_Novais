import React from 'react';
import slide from '../../res/img/slideTwo.svg'
import { PiStudentFill, PiFeatherFill } from "react-icons/pi";

const SlideTwo = () => {
    return (
        <div>
            <div>

                <div>

                    <h2>Unlock Infinite Knowledge</h2>


                    <p>
                        Craft compelling courses effortlessly with our platform, enabling you to create engaging content on any topic.
                        Seamlessly integrate video and theory lectures for a comprehensive learning experience, fostering effective education in just a few clicks
                    </p>


                    <div>
                        <div>
                            <div>
                                <PiStudentFill  />
                            </div>
                            <h3>Study Online</h3>
                            <p>Video & Theory Lecture</p>
                        </div>

                        <div>
                            <div>
                                <PiFeatherFill  />
                            </div>
                            <h3>Create Course</h3>
                            <p>Create Course on Any Topic</p>
                        </div>
                    </div>
                </div>
                <div>
                    <img
                        src={slide}
                        alt="Your Alt Text"
                        
                    />
                </div>
            </div>
        </div>
    );
};

export default SlideTwo;
