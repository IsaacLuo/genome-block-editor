import React from 'react';

import ProjectBasket from 'Components/ProjectBasket'
import FileExplorer from 'Components/FileExplorer'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import GenomeOperationPanel from 'Components/GenomeOperationPanel'
import GenomeBrowserTooltip from 'Components/GenomeBrowserTooltip'
import CreatePromoterTermiatorDlg from 'Components/dialogs/CreatePromoterTerminatorDlg'
import RemoveCreatedFeatureDlg from 'Components/dialogs/RemoveCreatedFeatureDlg'

const ProjectFunctions: React.FC = () => {
  return (
      <div className="main-panel">
        <FileExplorer/>
        <div className="basket-panel">
          <GenomeBrowser/>
          <GenomeBrowserTooltip/>
        </div>
        <div>
          <GenomeOperationPanel/>
        </div>
        <CreatePromoterTermiatorDlg/>
        <RemoveCreatedFeatureDlg/>

      </div>
  );
}

export default ProjectFunctions;
