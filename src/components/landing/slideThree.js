import React from "react";
import { PiKeyboard, PiVideo    } from "react-icons/pi";
import { RiAiGenerate } from "react-icons/ri";

const SlideThree = () => {
    return (
        <div>
            <div>
                <div>How it works</div>
            </div>
            <div>
              
                <div>
                    <PiKeyboard  />
                    <div>Enter Course Title</div>
                    <div>Enter the course title for which you want to generate content using AI</div>
                </div>

         
                <div>
                    <RiAiGenerate   />
                    <div>AI Generates Sub-Topic</div>
                    <div>AI will generate topics and subtopics based on the title you provide</div>
                </div>

               
                <div>
                    <PiVideo    />
                    <div>Video & Theory Course</div>
                    <div>AI will generate video and theory course allowing you to start learning</div>
                </div>
            </div>
        </div>
    );
};

export default SlideThree;
