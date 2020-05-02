import React, { useEffect } from 'react';

import ProjectBasket from 'Components/ProjectBasket'
import FileExplorer from 'Components/FileExplorer'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import GenomeOperationPanel from 'Components/GenomeOperationPanel'
import GenomeBrowserTooltip from 'Components/GenomeBrowserTooltip'
import CreatePromoterTermiatorDlg from 'Components/dialogs/CreatePromoterTerminatorDlg'
import RemoveCreatedFeatureDlg from 'Components/dialogs/RemoveCreatedFeatureDlg'
import ForkProjectDlg from 'Components/dialogs/ForkProjectDlg';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { LOAD_SOURCE_FILE_BY_PROJECT_ID } from 'actions';
import GenomeBrowserForHistory from 'Components/GenomeBrowserForHistory';
import ReplaceCodonDlg from 'Components/dialogs/ReplaceCodonDlg';
import PartDetailDlg from 'Components/dialogs/PartDetailDlg';
import InsertFeatureDlg from 'Components/dialogs/InsertFeatureDlg';
import DebugPanel from 'Components/DebugPanel';
import GenomeOperationMenu from 'Components/GenomeOperationMenu';
import { Collapse } from 'antd';

const ProjectFunctions: React.FC = (props:any) => {
  const {projectId} = useMappedState((state:IStoreState)=>({
    projectId: (state.sourceFile && state.sourceFile.projectId),
  }));

  const dispatch = useDispatch();

  useEffect(()=>{
  const {history, location} = props;

  const regx = /^\/genome_functions\/(.*)$/.exec(location.pathname);
  if (regx && regx[1]) {
      const pathId = regx[1];
      if (!projectId && pathId) {
        // id doesn't match, fetch project again
        dispatch({type:LOAD_SOURCE_FILE_BY_PROJECT_ID, data:pathId});
      } else if (projectId) {
        history.replace(`/genome_functions/${projectId}`, {projectId});
      }
  }

  },[projectId])

  return (
      <div className="main-panel">
        {/* <GenomeOperationMenu/> */}
        <Collapse defaultActiveKey={['1']} style={{width:'100%'}}>
          <Collapse.Panel header="" key="1">
              <FileExplorer/>
          </Collapse.Panel>
        </Collapse>
        <div className="basket-panel">
          <GenomeBrowser/>
        </div>

        <div>
          <GenomeOperationPanel/>
        </div>
        <CreatePromoterTermiatorDlg/>
        <RemoveCreatedFeatureDlg/>
        <ForkProjectDlg/>

        <GenomeBrowserForHistory/>
        <ReplaceCodonDlg/>
        <InsertFeatureDlg/>
        
        <GenomeBrowserTooltip/>

        <PartDetailDlg/>
        <DebugPanel/>
      </div>
  );
}

export default ProjectFunctions;
