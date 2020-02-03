import {Link} from 'react-router-dom';
import React from 'react';
import { Button } from 'antd';

const MainPage = () => {
    return <div>
        <div>
        <Button type="primary" size="large"><Link to="/genome_functions">genome functions</Link></Button>
        </div>
        <div>
        <Button type="primary" size="large"><Link to="/block_editor">block editor</Link></Button>
        </div>
    </div>
}

export default MainPage;