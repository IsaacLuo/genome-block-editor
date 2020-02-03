import React from 'react';

import ProjectBasket from 'Components/ProjectBasket'
import FileExplorer from 'Components/FileExplorer'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import ProjectOperationPanel from 'Components/ProjectOperationPanel'
import GenomeBrowserTooltip from 'Components/GenomeBrowserTooltip'

const BlockEditor: React.FC = () => {
  return (
      <div className="main-panel">
        <FileExplorer/>
        <div className="basket-panel">
          <GenomeBrowser/>
          <GenomeBrowserTooltip/>
        </div>
        <div className="project-basket">
          <div style={{flex:7}}>
            <ProjectBasket/>
          </div>
          <div style={{flex:3, background:'#fcec72', borderWidth:1}}>
            <ProjectOperationPanel/>
          </div>
        </div>
        <ResultSequence/>
      </div>
  );
}

export default BlockEditor;
