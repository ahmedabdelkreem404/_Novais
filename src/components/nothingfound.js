import React from 'react';
import Logo from '../res/img/found.svg';

const NothingFound = () => {

    return (
        <div>
            <img src={Logo}  alt="Nothing Found" />
            <p>Nothing Found</p>
        </div>
    );
};

export default NothingFound;
