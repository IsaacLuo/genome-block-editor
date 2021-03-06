import React, { useEffect } from 'react';

import ProjectBasket from 'Components/ProjectBasket'
import FileExplorer from 'Components/FileExplorer'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import GenomeOperationPanel from 'Components/GenomeOperationPanel'
import GenomeBrowserTooltip from 'Components/GenomeBrowserTooltip'
import CreatePromoterTermiatorDlg from 'Components/dialogs/taskDialogs/CreatePromoterTerminatorDlg'
import RemoveCreatedFeatureDlg from 'Components/dialogs/RemoveCreatedFeatureDlg'
import ForkProjectDlg from 'Components/dialogs/ForkProjectDlg';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { LOAD_SOURCE_FILE_BY_PROJECT_ID } from 'actions';
import GenomeBrowserForHistory from 'Components/GenomeBrowserForHistory';
import ReplaceCodonDlg from 'Components/dialogs/taskDialogs/ReplaceCodonDlg';
import PartDetailDlg from 'Components/dialogs/PartDetailDlg';
import InsertFeatureDlg from 'Components/dialogs/taskDialogs/InsertFeatureDlg';
import DebugPanel from 'Components/DebugPanel';
import { Collapse, Tabs } from 'antd';
import RemoveIntronDlg from 'Components/dialogs/taskDialogs/RemoveIntronDlg';
import SequenceEditorDlg from 'Components/dialogs/SequenceEditorDlg';
import ProjectLogPanel from 'Components/ProjectLogPanel';

const ProjectFunctions: React.FC = (props:any) => {
  const {projectId, activeSummaryTabKey} = useMappedState((state:IStoreState)=>({
    projectId: (state.sourceFile && state.sourceFile.projectId),
    activeSummaryTabKey: state.componentVisible.activeSummaryTabKey,
  }));

  const dispatch = useDispatch();

  useEffect(()=>{
  const {history, location} = props;

  const regx = /^\/genome_functions\/(.*)$/.exec(location.pathname);
  if (regx && regx[1]) {
      const pathId = regx[1];
      if (!projectId && pathId) {
        // id doesn't match, fetch project again
        console.log('reload project ', pathId);
        dispatch({type:LOAD_SOURCE_FILE_BY_PROJECT_ID, data:pathId});
      } else if (projectId) {
        console.log('overwrite path ', projectId);
        history.replace(`/genome_functions/${projectId}`, {projectId});
      }
  } else if (projectId) {
    console.log('overwrite path ', projectId);
    history.replace(`/genome_functions/${projectId}`, {projectId});
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

        {process.env.NODE_ENV === 'development' && <div>
          <GenomeOperationPanel/>
        </div>}

        <Collapse defaultActiveKey={['1']} style={{width:'100%'}} onChange={(keys)=>{
          if (keys.length === 0) {
            dispatch({type:'GF_SET_TAB', data:'summaryTab'});
          }
        }}>
          <Collapse.Panel header="more details" key="1">
            <Tabs activeKey={activeSummaryTabKey} onChange={(key)=>{
            dispatch({type:'GF_SET_TAB', data:key});
          }}>
            <Tabs.TabPane tab="Summary" key="summaryTab">
                <div>summary</div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="History" key="historyTab">
                <GenomeBrowserForHistory/>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Changelog" key="projectLogTab">
                <ProjectLogPanel/>
              </Tabs.TabPane>
          </Tabs>
          </Collapse.Panel>
        </Collapse>
        <CreatePromoterTermiatorDlg/>
        <RemoveCreatedFeatureDlg/>
        <ForkProjectDlg/>

        
        <ReplaceCodonDlg/>
        <InsertFeatureDlg/>
        <RemoveIntronDlg/>

        <GenomeBrowserTooltip/>

        <PartDetailDlg/>
        <SequenceEditorDlg/>
        {process.env.NODE_ENV === 'development' && <DebugPanel/>}
      </div>
  );
}

export default ProjectFunctions;
