import React from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import OpenFileDialog from 'Components/OpenFileDialog'
import SaveFileDialog from 'Components/SaveFileDialog'
import ExportGenbankDialog from 'Components/ExportGenbankDialog'

const OperationPanel = () => {
  const {project, openFileDialogVisible, saveFileDialogVisible, exportGenbankDialogVisible} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
    projectCorsor: state.projectCorsor,
    openFileDialogVisible: state.componentVisible.openFileDialogVisible,
    saveFileDialogVisible: state.componentVisible.saveFileDialogVisible,
    exportGenbankDialogVisible: state.componentVisible.exportGenbankDialogVisible,
  }));
  const dispatch = useDispatch();
  // const [queryProjectGanbankExec, queryProjectGanbank] = useLazyQuery(gql`
  //   query ProjectGenbank($id: ID!){
  //     projectGenbank (_id:$id)
  //   }
  // `);
  // const onClickExportGenbank = async ()=>{
  //   await queryProjectGanbankExec({variables:{id:project._id}})
  //   console.log(queryProjectGanbank);
  //   const fileURL = queryProjectGanbank.data.projectGenbank
  //   const a = document.createElement('a');
  //   a.href = `${backendURL}/${fileURL}`;
  //   a.target =  '_blank';
  //   a.download = `test.gb`;
  //   a.click();
  // }

  // if (queryProjectGanbank.data && queryProjectGanbank.data.projectGenbank.success) {

  // }
  
  return <React.Fragment>
    <div><a onClick={()=>dispatch({type:'SHOW_OPEN_FILE_DIALOG'})}>open project</a></div>
    
    {project && project.parts.length > 0 && 
      <React.Fragment>
        <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: false}})}>save</a></div>
        <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: true}})}>save as...</a></div>
        {/* <div><a onClick={onClickExportGenbank}>export genbank</a></div> */}
        <div><a onClick={()=>dispatch({type:'SHOW_EXPORT_GENBANK_DIALOG'})}>export genbank</a></div>

      </React.Fragment>
    }

    {openFileDialogVisible && <OpenFileDialog/>}
    {saveFileDialogVisible && <SaveFileDialog/>}
    {exportGenbankDialogVisible && <ExportGenbankDialog/>}
  </React.Fragment>;
};

export default OperationPanel