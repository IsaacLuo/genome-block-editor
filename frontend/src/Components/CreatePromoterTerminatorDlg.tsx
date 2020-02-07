import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal,} from 'antd';

const CreatePromoterTermiatorDlg = () => {
  const {showDialog} = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.generatePromoterTerminatorDialogVisible,
  }));
  const [confirming, setConfirming] = useState<boolean>(false);
  const dispatch = useDispatch();
  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{}}
    confirmLoading={confirming}
    onCancel={()=>dispatch({type:'HIDE_CREATE_PROMOTER_TERMINATOR_DIALOG'})}
  >
    <p>test</p>
  </Modal>
}

export default CreatePromoterTermiatorDlg;