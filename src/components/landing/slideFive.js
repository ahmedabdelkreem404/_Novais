import React from 'react';
import { Avatar, Blockquote, Rating } from 'flowbite-react';
import { review, from, photoURL, profession} from '../../constants';


const SlideFive = () => {
    return (
     <div>
           <figure>
            <div>
                <Rating size="md">
                    <Rating.Star color='black'  />
                    <Rating.Star color='black'  />
                    <Rating.Star color='black'  />
                    <Rating.Star color='black'  />
                    <Rating.Star color='black'   />
                </Rating>
            </div>
            <Blockquote>
                <p>
                  {review}
                </p>
            </Blockquote>
            <figcaption>
                <Avatar rounded size="xs" img={photoURL} alt="profile picture" />
                <div>
                    <cite>{from}</cite>
                    <cite>{profession}</cite>
                </div>
            </figcaption>
        </figure>
     </div>
    );
};

export default SlideFive;
