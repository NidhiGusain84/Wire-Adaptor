public with sharing class AccountHelper{
    @AuraEnabled(cacheable = true)
    public static List<Account> getParentAccounts(){
        return [SELECT Id, Name, Industry
                FROM Account
                WHERE AnnualRevenue != null
                WITH USER_MODE];
    }

}