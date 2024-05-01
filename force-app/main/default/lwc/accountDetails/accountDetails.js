import { LightningElement, api, wire } from 'lwc';
import getParentAccounts from '@salesforce/apex/AccountHelper.getParentAccounts';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from 'lightning/navigation';
import ACCOUNT_ID from '@salesforce/schema/Account.Id';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import ACCOUNT_SLA_TYPE from '@salesforce/schema/Account.SLA__c';
import ACCOUNT_PARENT from '@salesforce/schema/Account.ParentId';
import ACCOUNT_SLA_EXPIRATION from '@salesforce/schema/Account.SLAExpirationDate__c';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import ACCOUNT_NO_OF_LOCATION from '@salesforce/schema/Account.NumberOfLocations__c';
import ACCOUNT_DESCRIPTION from '@salesforce/schema/Account.Description';
import { createRecord, getRecord, getFieldValue, updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = [ACCOUNT_PARENT, ACCOUNT_NAME, ACCOUNT_SLA_EXPIRATION, ACCOUNT_SLA_TYPE, ACCOUNT_NO_OF_LOCATION, ACCOUNT_DESCRIPTION];
export default class AccountDetails extends NavigationMixin(LightningElement) {
    options = [];
    selectedParentAccount = "";
    selectedNoOfLocation = "1";
    selectedAccountName = "";
    selectedExpirationDate = null;
    selectedSlaType = "";
    selectedDescription = "";

    @api recordId;

    @wire(getRecord, {
        recordId: "$recordId",
        fields: FIELDS
    }) wiredGetRecord_Function({ data, error }) {
        if (data) {
            this.selectedParentAccount = getFieldValue(data, ACCOUNT_PARENT);
            this.selectedNoOfLocation = getFieldValue(data, ACCOUNT_NO_OF_LOCATION);
            this.selectedAccountName = getFieldValue(data, ACCOUNT_NAME);
            this.selectedDescription = getFieldValue(data, ACCOUNT_DESCRIPTION);
            this.selectedExpirationDate = getFieldValue(data, ACCOUNT_SLA_EXPIRATION);
            this.selectedSlaType = getFieldValue(data, ACCOUNT_SLA_TYPE);
        } else if (error) {

        }
    };

    @wire(getParentAccounts)
    wired_getParentAccounts({ data, error }) {
        if (data) {
            this.options = data.map(currentItem => ({
                label: currentItem.Name,
                value: currentItem.Id
            }));
        }
        else if (error) {
            console.log("Error while getting Parent Records", error);
        }
    }

    handleChange(event) {
        let { name, value } = event.target;
        if (name === "parentAccount") {
            this.selectedParentAccount = value;
        }
        if (name === "accountName") {
            this.selectedAccountName = value;
        }
        if (name === "slaExpDate") {
            this.selectedExpirationDate = value;
        }
        if (name === "slaType") {
            this.selectedSlaType = value;
        }
        if (name === "noOfLoacation") {
            this.selectedNoOfLocation = value;
        }
        if (name === "description") {
            this.selectedDescription = value;
        }
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    accountObjectInfo;

    @wire(getPicklistValues, {
        recordTypeId: "$accountObjectInfo.data.defaultRecordTypeId",
        fieldApiName: ACCOUNT_SLA_TYPE
    }) slaPicklist;

    saveRecord() {
        if (this.validateInput()) {
            let inputFields = {};
            inputFields[ACCOUNT_NAME.fieldApiName] = this.selectedAccountName;
            inputFields[ACCOUNT_PARENT.fieldApiName] = this.selectedParentAccount;
            inputFields[ACCOUNT_SLA_EXPIRATION.fieldApiName] = this.selectedExpirationDate;
            inputFields[ACCOUNT_NO_OF_LOCATION.fieldApiName] = this.selectedNoOfLocation;
            inputFields[ACCOUNT_SLA_TYPE.fieldApiName] = this.selectedSlaType;
            inputFields[ACCOUNT_DESCRIPTION.fieldApiName] = this.selectedDescription;

            if (this.recordId) {
                //update operation
                inputFields[ACCOUNT_ID.fieldApiName] = this.recordId;
                let recordInput = {
                    fields: inputFields
                }
                updateRecord(recordInput)
                    .then((result) => {
                        console.log("Record Updated Successfully", result);
                        this.showToast();
                    })
                    .catch((error) => {
                        console.log("Record updation failed", error);
                    });

            } else {
                let recordInput = {
                    apiName: ACCOUNT_OBJECT.objectApiName,
                    fields: inputFields
                }

                createRecord(recordInput)
                    .then((result) => {
                        let pageReference = {
                            type: 'standard__recordPage',
                            attributes: {
                                recordId: result.id,
                                objectApiName: ACCOUNT_OBJECT.objectApiName,
                                actionName: 'view'
                            }
                        }

                        this[NavigationMixin.Navigate](pageReference);

                    })
                    .catch((error) => {
                        console.log("Error in create record", error)
                    });
            }

        } else {
            console.log("Inputs are not valid.");
        }
    }
    validateInput() {
        let fields = Array.from(this.template.querySelectorAll("validateMe"));
        let isValid = fields.every((currentItem) => currentItem.checkValidity());
        return isValid;
    }

    get formTitle() {
        if (this.recordId) {
            return "Edit Account";
        } else {
            return "Create Account";
        }
    }

    showToast() {
        const event = new ShowToastEvent({
            title: 'Success',
            variant: "success",
            message:
                'Account updated successfully.',
        });
        this.dispatchEvent(event);
    }

    deleteHandler() {
        deleteRecord(this.recordId)
            .then((result) => {
                console.log("Record deleted successfully");             
            })
            .catch((error) => {
                console.log("Record deletion failed", error);
            });
    }

    get isDeleteAvailable() {
        if (this.recordId) {
            return true;
        } else {
            return false;
        }
    }

}