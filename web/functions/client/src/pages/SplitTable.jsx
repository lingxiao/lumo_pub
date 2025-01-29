/**
 *
 *
 * @Package: SplitTable
 * @Date   : 8/5/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import useCheckMobileScreen, {useCheckBrowser} from './../hoc/useCheckMobileScreen';

import { COLORS }    from './../components/constants';
import { DarkButton } from './../components/ButtonViews';
import { ActionProgressWithProgress } from './../components/ButtonViews';

import { AppTextFieldNoUnderLine, AppTextField } from './../components/ChatTextInput'
import { CenterHorizontalView } from './../components/UtilViews';

import {
	cap,
	trivialNum,
	trivialString,
} from './../model/utils'

import {
	ETH_ADMIN_ADDRESS,
} from './../model/core';

import {
	useNftvieWstyles,
} from './AppStoryboardFragments';

import withAuth   from './../hoc/withAuth';


/******************************************************
	@View exported
******************************************************/

/**
 *
 * @use: revenue split view
 *
*/

function SplitTable(props){

	const { 
		style, 
		tellUser,		
		storyboard,
		is_onboarding,
		showProgress,
		eshowProgress,
		didChangeSplits,
	} = props

	const [ datasource, edatasource ] = useState([]);
	const [ _update, _eupdate ] = useState(0);
	const [ loading, eloading ] = useState(true);
	const [ hideBtn, ehideBtn ] = useState(false);

	const [ sbtn, esbtn ] = useState("Next");
	const [ did_confirm, edid_confirm ] = useState(0);

	const isOnMobile = useCheckMobileScreen(1000);

	let container_style = {
		width: 'fit-content',
		border: `0.25px solid ${COLORS.surface3}`,
		padding: '24px',
		...(style ?? {}),
	}

	// load 
	useEffect(async () => {
		if ( is_onboarding  ){
			await storyboard.fetch_suggested_splits_at_onboarding({ 
				add_all_licenses: true,
		        then: ({ accounts }) => {
					eloading(false);		        	
		        	edatasource(accounts ?? []);
		        }
			})
		} else {
			await storyboard.fetch_current_split_at_erc1155({
				then_read_fail: (str) => { 
					eloading(false);					
					tellUser(str) 
				},
				then_read_success: ({ accounts }) => {
					eloading(false);
					edatasource(accounts)
				}
			});
		}		
	},[]);

	// add row of payees
	async function onAddRow(){
		edid_confirm(0)
		esbtn("Next")
		const blank_row = { name: "N/A", pk: '0x..', note: "N/A", share_in_percent: 0.01, isBlank: true };
		edatasource([ ...datasource, blank_row ])
	}

	/**
     * 
     * @use: call on chain fn to change splits
     *
     **/
	async function onSubmit(){

		let { splits, denominator } = storyboard.compute_splits_st_constraints({ splits: datasource });
		edatasource( splits ?? [] )

		if ( denominator !== 1.0 ){

			let value = Math.round(denominator*10000)/100
			tellUser(`Please make sure all the % add up to 100! Right now they add up to ${denominator*100}`)

		} else if ( did_confirm === 0 ) {

			esbtn("Confirm these %")
			tellUser("We preliminarily adjust the percentages so they add up to approximately 100. So please confirm these are the percentages you want!")
			edid_confirm(1)

		} else if ( did_confirm >= 1 ) {

			tellUser(`Setting your percentages on chain, you will be asked to sign once. If you change your mind later, you can always reset these percentages`)
			eshowProgress(true)

			await storyboard.update_payout_window({
				splits: splits,
				then: ({ success, message, data }) => {
					eshowProgress(false)
					if ( !success ){
						tellUser("You have to release all current payables before adjust splits.")
						esbtn("try again")
					} else {
						tellUser("Your splits have been adjusted, the updates will be reflected once the block has been confirmed.")
						esbtn("Split Adjusted")
						ehideBtn(true);
						if ( typeof didChangeSplits === 'function' ){
							didChangeSplits(true);
						}
					}
				}
			})
		}

	}

	// --------------------------------------------------------------------------------------------
	// table cell responders

	function onChangePk({ idx, pk }){
		edid_confirm(0);
		esbtn("Recompute Split")
		if ( idx < 0 || idx > datasource.length - 1 || trivialString(pk) ){
			return;
		} else {
			var _new_datasource = datasource;
			let item = datasource[idx];
			let _item = { ...item, pk: pk };
			_new_datasource[idx] = _item;
			edatasource(_new_datasource)
			_eupdate(Math.random())
		}
	}

	function onChangeShare({ idx, share }){
		edid_confirm(0)
		esbtn("Recompute Split")
		if ( idx < 0 || idx > datasource.length - 1 || trivialNum(share) ){ //|| share < 0 || share > 100 ){
			return;
		} else {
			var _new_datasource = datasource;
			let item = datasource[idx];	
			let rshare = Math.round(share);
			let _share = Math.min(1, Math.max(rshare/100,0));
			let _rshare = Math.round(_share*100)/100;
			let _item = { ...item, share_in_percent: _rshare };
			_new_datasource[idx] = _item;
			edatasource(_new_datasource)
			_eupdate(Math.random())
		}
	}

	// --------------------------------------------------------------------------------------------
	// render

	return (
		<Stack style={container_style} direction='column'>
			{
				loading 
				?
                <CenterHorizontalView>
					<div style={{fontFamily:'NeueMachina-Bold', color: COLORS.text2, fontSize:'18px', marginBottom: '2vh'}}>
						{'Loading, this may take a few seconds...'}
					</div>
                </CenterHorizontalView>
				:
				<Stack style={{marginBottom:'24px'}}>
					{datasource.map((data,index) => (
						<_SplitTableCell 
							key={index}
							idx={index}
							data={data} 
							update_cell={_update}
							onChangePk={onChangePk}
							onChangeShare={onChangeShare}
						/>
					))}
				</Stack>
			}
            <Stack direction='row'>	
		        <Box sx={{ flexGrow: 1 }} />
		        { showProgress || loading || hideBtn
		        	? 
		        	<div/> 
		        	:
		            <DarkButton 
		            	onClick={onAddRow}
		            	sx={bstyle2}
		            	showProgress={showProgress}
		            > 
		            	{ 'Add Payee'}
		            </DarkButton>		
		        }
	            <Stack direction='row' style={{height:'60px'}}>
	            	{ datasource.length === 0 || hideBtn || loading
	            		? 
	            		<div/> 
	            		:
		                <ActionProgressWithProgress
		                    label={sbtn}
		                    showProgress={showProgress}
		                    onClick = {onSubmit}
		                    sx={{width:'100%', marginRight:'24px', marginLeft:'24px'}}
		                />  	                
		            }
	            </Stack>
            </Stack>
		</Stack>
	)	
}

export default withAuth(SplitTable);


/******************************************************
	@View cell
******************************************************/


/**
 *
 * @use: one narrow row of users
 *
 **/
function _SplitTableCell(props){

    const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();
	const { isSafari } = useCheckBrowser();

    const { 
    	idx,
        data, 
        row_style,
		onChangePk,
		update_cell,
		onChangeShare,
    } = props;

    const [ _data, _edata ] = useState(data);

    useEffect(() => {
    	_edata(data);
    },[data, update_cell])

	const _row_style = {
	    ...(row_style ?? {}),
	    width: '100%',
	    borderBottom: '0px solid transparent',        
	}

	const _cell_label_style = {
		width:'fit-content', 
		marginTop: isSafari ? '-8px' : '6px', 
		marginRight: '12px', 		
		textAlign: 'left',
		fontFamily: 'NeueMachina-Bold',
		fontSize: `calc(22px+2vw)`,
	}

    return (
        <TableRow style={_row_style}>
            <TableCell style={{...cell_style_h2, width: '30%'}} align="left">
	            <Stack direction="row">	
	            	<div style={_cell_label_style}>
	            		{'Alias:'}
	            	</div>		            
					<AppTextFieldNoUnderLine
						disabled
		                standard
		                hiddenLabel
		                value      = {_data.name}
		                onChange   = {cap}
		                className  = {cell_style_h2}
		                inputProps = {{style: h1s}}
		                style={{}}
		            />            
	            </Stack>  
	       </TableCell>	           
            <TableCell style={{...cell_style_h2, cursor: 'pointer', marginLeft:'-2vw'}} align="left">
	            <Stack direction="row">	
		            <div style={_cell_label_style}>
	            		{'To:'}
	            	</div>		            
					<AppTextField
		                standard
		                hiddenLabel
		                value      = {_data.pk}
		                disabled   = {_data.pk === ETH_ADMIN_ADDRESS()}
		                onChange   = {(e) => { onChangePk({ idx: idx, pk: e.target.value ?? "" }) }}
		                className  = {cell_style_h2}
		                inputProps = {{style: h1s}}
		                style={{cursor:'pointer', width: 'fit-content'}}
		            />            
	            </Stack>   
	       </TableCell>	        
            <TableCell style={{...cell_style_h2, marginLeft:'-2vw'}} align="left">
	            <Stack direction="row">	
		            <div style={_cell_label_style}>
	            		{'for:'}
	            	</div>		            
					<AppTextFieldNoUnderLine
		                standard
		                disabled
		                hiddenLabel
		                value      = {_data.note}
		                onChange   = {(e) => {}}
		                className  = {cell_style_h2}
		                inputProps = {{style: h1s}}
		                style={{width:'70%', minWidth: 'fit-content'}}
		            />            
	            </Stack>   
	       </TableCell>	        	       
            <TableCell style={{...cell_style_h2, cursor: 'pointer', marginLeft:'-2vw'}} align="left">
	            <Stack direction="row">	
		            <div style={_cell_label_style}>
	            		{'Split:'}
	            	</div>		                        
					<AppTextField
		                standard
		                hiddenLabel
		                value      = {Math.round(_data.share_in_percent*100)}
		                onChange   = {(e) => { onChangeShare({ idx: idx, share: e.target.value ?? 0 })}}
		                className  = {tclasses.feature_box_child_h1bs}
		                inputProps = {{style: h1bs}}
		                style={{width: '48px', cursor: 'pointer'}}
		            />
	            	<div className={tclasses.feature_box_child_h1bs} style={{width:'fit-content', marginTop: '7px'}}>
	            		{'%'}
	            	</div>		            		            
		        </Stack>
	        </TableCell>	            
        </TableRow>        
    )
}


const bstyle2 = {
	borderRadius: 12,
	fontSize: '18px',		
	fontFamily: 'NeueMachina-Bold',
	width: 'fit-content',
	color: COLORS.text3,
	height: '60px',
	marginRight: '48px',
	paddingLeft: '24px',
	paddingRight:'24px',
}

const cell_style_h2 = {
    fontFamily: 'NeueMachina-Regular',
    fontSize: `calc(18px+2vw)`,
    color: COLORS.text2,
    borderBottom: '0px solid transparent',
};    

const h1s = {
    fontSize  : `calc(18px+1vw)`,
	fontFamily: 'NeueMachina-Regular',
	color     : COLORS.text,		
}
const h1bs = {
    fontSize  : `calc(18px+1vw)`,
	fontFamily: 'NeueMachina-Light',
	color     : COLORS.text,		
	textAlign : 'right',
} 



