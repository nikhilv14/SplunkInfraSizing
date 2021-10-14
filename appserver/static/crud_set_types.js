require(["jquery", "splunkjs/mvc/simplexml/ready!"], function($) {
	$("[id^=numbers_only]")
		.attr('type','number')
	$("[id^=numbers_0_100_step001]")
		.attr('type','number')
		.attr('min','0')
		.attr('max','100')
		.attr('step','0.01')
	$("[id^=email_only]")
                .attr('type','email')
		
	$("[id^=date]")
		.attr('type','date')
	$("[id^=date_restrictions]")
		.attr('type','date')
		.attr('min','2017-01-01')
		
	$("[id^=range]")
		.attr('type','range')
		.attr('min','0')
		.attr('max','10')
	$("[id^=to_radio]")
		.attr('type','radio')
});

require([
        'underscore',
        'jquery',
	'splunkjs/ready!',
	'splunkjs/mvc/searchmanager',
	'splunkjs/mvc/tableview',
        'splunkjs/mvc',
        'splunkjs/mvc/simplexml/ready!'
], function(_,$,mvc){
	var demand_id=(function() {
		var d = new Date().valueOf();
		var n = d.toString();
		var result = '';
		var length = 10;
		var p = n.length;
		var chars = '0123456789';
		// bold for illustration
		for (var i = length; i > 0; --i){
			result += ((i & 1) && n.charAt(p) ?  n.charAt(p)  : chars[Math.floor(Math.random() * chars.length)]);
			if(i & 1) p--;
		};
		$('[name="form_demand_id"]').val(result);
		$('[name="form_demand_id"]').prop('disabled',true);
		return result;
	})();
	var platform_selected;
        var tokens = mvc.Components.get('submitted');
        var createDemand = mvc.Components.get('createDemand'); //new/update demand
        var updateDemand = mvc.Components.get('updateDemand'); //new/update demand
        var createDemandInfra = mvc.Components.get('createDemandInfra'); //infra search
	var updateDemandInfra = mvc.Components.get('updateDemandInfra');
	var deleteDemandInfra = mvc.Components.get('deleteDemandInfra');
        var createSpInfra = mvc.Components.get('createSpInfra'); //Sp infra search
        var SearchManager = require("splunkjs/mvc/searchmanager");
        var TableView = require('splunkjs/mvc/tableview');
	var infraTableSearch;
        var infraTable = new TableView({
                        id: "element1",
                        count: 20,
                        dataOverlayMode: "none",
                        drilldown: "cell",
                        rowNumbers: "false",
                        wrap: "true",
                        managerid: "search1",
                        el: $("#infraTable")
                }).render();
	var deviceType;
	var spinfraTableSearch;
	var spinfraTable = new TableView({
			id: "element2",
                        count: 20,
                        dataOverlayMode: "none",
                        drilldown: "cell",
                        rowNumbers: "false",
                        wrap: "true",
                        managerid: "search2",
                        el: $("#spinfraTable")
		}).render();
	var spInfraTokens = function(){
		tokens.set('tok_sp_create', 'true');
		tokens.set('tok_demand_id', demand_id);
		tokens.set('tok_requester',$('[name="form_primary_contact_email"]').val());
	};
	var totalgbsSearch;
	var totalgbs;
	var gbMultiplier = function(device){
		var multi = 0.0;
		switch(device) {
			case "Windows Servers ‐ HIGH EPS" : {
				multi=2.82;
				deviceType="Servers";
				break;
			}
			case "Windows Servers ‐ MED EPS" : {
				multi=0.17;
				deviceType="Servers";
				break;
			}
			case "Windows Servers / Desktops ‐ LOW EPS" : {
				multi=0.06;
				deviceType="Servers";
				break;
			}
			case "Windows AD Servers" : {
				multi=0.56;
				deviceType="Servers";
				break;
			}
			case "Linux / Unix Servers" : {
				multi=0.02;
				deviceType="Servers";
				break;
			}
			case "Mainframe / Midrange" : {
				multi=0.05;
				deviceType="Servers";
				break;
			}
			case "Network Routers" : {
				multi=0.01;
				deviceType="Network Infrastructure";
				break;
			}
			case "Network Switches" : {
				multi=0.02;
				deviceType="Network Infrastructure";
				break;
			}
			case "Network Switches (NetFlow / Jflow / S‐Flow)" : {
				multi=0.97;
				deviceType="Network Infrastructure";
				break;
			}
			case "Network Wireless LAN" : {
				multi=0.06;
				deviceType="Network Infrastructure";
				break;
			}
			case "Network Load‐Balancers" : {
				multi=0.06;
				deviceType="Network Infrastructure";
				break;
			}
			case "Other Network Devices" : {
				multi=0.4;
				deviceType="Network Infrastructure";
				break;
			}
			case "Network Firewalls (Check Point ‐ Internal)" : {
				multi=0.2;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network Firewalls (Cisco - Internal)" : {
				multi=0.2;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network Firewalls (Check Point ‐ DMZ)" : {
				multi=1.01;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network Firewalls (Cisco ‐ DMZ)" : {
				multi=0.6;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network IPS/IDS" : {
				multi=0.36;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network VPN" : {
				multi=0.05;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network AntiSpam" : {
				multi=0.16;
				deviceType="Security Infrastructure";
				break;
			}
			case "Network Web Proxy" : {
				multi=0.78;
				deviceType="Security Infrastructure";
				break;
			}
			case "Other Security Devices" : {
				multi=0.41;
				deviceType="Security Infrastructure";
				break;
			}
			case "Web Servers (IIS, Apache, Tomcat)" : {
				multi=0.06;
				deviceType="Applications";
				break;
			}
			case "Database (MSSQL, Oracle, Sybase - indicate # of instances)" : {
				multi=0.05;
				deviceType="Applications";
				break;
			}
			case "Email Servers (Exchange, Sendmail, BES, etc)" : {
				multi=0.04;
				deviceType="Applications";
				break;
			}
			case "AntiVirus / DLP Server(200000 clients)" : {
				multi=1.01;
				deviceType="Applications";
				break;
			}
			case "Other Applications" : {
				multi=0.41;
				deviceType="Applications";
				break;
			}
			default:
				multi=0;
				deviceType="Other";
				break;
		};
		return multi;
	};
        var indexernum = function(gbpday){
                var inum = 1;
                switch(true) {
			case (gbpday <= 2) : {
                                inum=1;
                                break;
                 	}
			case (gbpday > 2 && gbpday <= 300) : {
                                inum=2;
                                break;
                 	}
			case (gbpday > 300 && gbpday <= 600) : {
                                inum=3;
                                break;
                 	}
			case (gbpday > 600 && gbpday <= 1000) : {
                                inum=6;
                                break;
                 	}
			case (gbpday > 1000 && gbpday <= 2000) : {
                                inum=12;
                                break;
                 	}
			case (gbpday > 2000 && gbpday <= 3000) : {
                                inum=18;
                                break;
                 	}
			default:
				inum=1;
				break;
		};
		return inum;
	};
        var shnum = function(gbpday){
                var shnum = 1;
                switch(true) {
			case (gbpday <= 2) : {
                                shnum=1;
                                break;
                 	}
			case (gbpday > 2 && gbpday <= 300) : {
                                shnum=1;
                                break;
                 	}
			case (gbpday > 300 && gbpday <= 600) : {
                                shnum=2;
                                break;
                 	}
			case (gbpday > 600 && gbpday <= 1000) : {
                                shnum=2;
                                break;
                 	}
			case (gbpday > 1000 && gbpday <= 2000) : {
                                shnum=2;
                                break;
                 	}
			case (gbpday > 2000 && gbpday <= 3000) : {
                                shnum=3;
                                break;
                 	}
			default:
				shnum=1;
				break;
		};
		return shnum;
	};
	var hf1search;
	var hf2search;
	var dssearch;
	var cmsearch;
	var idxsearch = new Array();
	var depsearch;
	var shssearch = new Array();
	$('#changetabbutton').click(function(e){
 	       e.preventDefault();
        	$('#tabs a[href="#second"]').tab('show');
    	});
	$('#updateDemandButton').click(function(e){
 		e.preventDefault();
        	$('#tabs a[href="#second"]').tab('show');
		demand_id = $('[name="old_demand_id"]').val();
		$('[name="form_demand_id"]').val(demand_id);
		updateDemandSearch = new SearchManager({
                         id: "updateDemandSearch",
                         search: "| inputlookup dm_lookup | search demand_id="+demand_id+" | table plant_id, primary_contact, primary_contact_email, secondary_contact, secondary_contact_email, business_unit, iso_contact, cism_group, demand_summary, main_objectives, requested_delivery_date, cost_center, business_domain, additional_statements, _key",
                         preview: true,
                         autostart: true,
                         cache: true
                });
		var myResults = updateDemandSearch.data("results");
		myResults.on("data", function() {
                      	resultArray = myResults.data().rows;
			$('[name="form_plant_id"]').val(resultArray[0][0]);
			$('[name="form_primary_contact"]').val(resultArray[0][1]);
			$('[name="form_primary_contact_email"]').val(resultArray[0][2]);
			$('[name="form_secondary_contact"]').val(resultArray[0][3]);
			$('[name="form_secondary_contact_email"]').val(resultArray[0][4]);
			$('[name="form_business_unit"]').val(resultArray[0][5]);
			$('[name="form_iso_contact"]').val(resultArray[0][6]);
			$('[name="form_cism_group_name"]').val(resultArray[0][7]);
			$('[name="form_demand_summary"]').val(resultArray[0][8]);
			$('[name="form_main_objectives"]').val(resultArray[0][9]);
			d = new Date(parseInt(resultArray[0][10]));
			t = d.getUTCFullYear()+ '-' + ((d.getUTCMonth() + 1) > 9 ? ""+(d.getUTCMonth() + 1) : "0"+(d.getUTCMonth() + 1)) + '-' + (d.getUTCDate()>9 ? ""+d.getUTCDate() : "0"+d.getUTCDate());
			$('[name="form_requested_delivery_date"]').val(t);
			$('[name="form_funding_cost_center"]').val(resultArray[0][11]);
			$('[name="form_business_domain"]').val(resultArray[0][12]);
			$('[name="form_additional_statements"]').val(resultArray[0][13]);
			$('[name="demand_key"]').val(resultArray[0][14]);	
                });
		updateDemandSearch.on('search:done', function(state, job){
			console.log('Update search done');
			if (state.content.resultCount === 0) {
				alert('Invalid Demand ID or you do not have acceess to location\'s demand');
                        	window.location.reload();
			}
		});
    	});
    	$('#finishbutton').click(function(e){
        	e.preventDefault();
        	$('#tabs a[href="#third"]').tab('show');
		totalgbsSearch = new SearchManager({
                         id: "totalgbs",
                         search: "| inputlookup dm_infra_lookup | search demand_id="+demand_id+" |  stats sum(estd_log_size_gb) as totalgbs",
                         preview: true,
                         autostart: true,
                         cache: true

                });
		var myResults = totalgbsSearch.data("results");
		myResults.on("data", function() {
     			resultArray = myResults.data().rows;
			totalgbs = (resultArray == null) ? 0:resultArray[0][0];
		});
		totalgbsSearch.on('search:done', function(){
			$('[name="form_totalgb"]').val(Math.round((parseFloat(totalgbs) + 0.00001)*100)/100);
			$('[name="form_totalgb"]').prop('disabled','true');
			$('[name="form_retention"]').val(90);
			$('[name="form_retention"]').prop('disabled','true');
			$('[name="form_replication"]').val(2);
			$('[name="form_replication"]').prop('disabled','true');
			$('[name="form_searchfactor"]').val(2);
			$('[name="form_searchfactor"]').prop('disabled','true');
			$('[name="form_totalstorage"]').val(Math.round(((($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))/1024)+0.00001)*100)/100);
			$('[name="form_totalstorage"]').prop('disabled','true');
			$('#submitDemand').click();
   		});
        });

	$("input[name='form_retention']").on('keyup change',function(){
                total = isNaN(parseInt($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))) ? 0 :(Math.round(((($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))/1024)+0.00001)*100)/100);
                $('[name="form_totalstorage"]').val(total);
        });
	$("input[name='form_replication']").on('keyup change',function(){
                total = isNaN(parseInt($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))) ? 0 :(Math.round(((($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))/1024)+0.00001)*100)/100);
                $('[name="form_totalstorage"]').val(total);
        });
	$("input[name='form_searchfactor']").on('keyup change',function(){
                total = isNaN(parseInt($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))) ? 0 :(Math.round(((($('[name="form_retention"]').val() * ((0.15*$('[name="form_totalgb"]').val()*$('[name="form_replication"]').val())+(0.35*$('[name="form_totalgb"]').val()*$('[name="form_searchfactor"]').val())))/1024)+0.00001)*100)/100);
                $('[name="form_totalstorage"]').val(total);
        });
	

	$(document).on('click', '#submitDemand', function(e){
		e.preventDefault();
		//hostname, ip, storage, ram, os, component, cores
		indexers = indexernum($('[name="form_totalgb"]').val());
		console.log(indexers);
		shs = shnum($('[name="form_totalgb"]').val());
		console.log(shs);
		spinfraTableSearch = new SearchManager({
                         id: "search2",
                         search: "| inputlookup dm_splunk_infra_lookup| search demand_id="+demand_id+" | table provisioned_hostname, provisioned_ip, splunk_component, cpu_cores, ram, storage_tb, os",
                         preview: true,
                         autostart: false,
                         cache: true
                });
		spInfraCleanSearch = new SearchManager({
                         id: "cleansearch",
                         search: "| inputlookup dm_splunk_infra_lookup | eval key=_key | WHERE NOT demand_id="+demand_id+" | outputlookup dm_splunk_infra_lookup",
                         preview: true,
                         autostart: false,
                         cache: true
                });
		hf1search = new SearchManager({
                         id: "hf1",
                         search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"HeavyForwarder1\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"16 GB\"| eval os = \"Windows\"| eval splunk_component = \"Heavy Forwarder\"| eval cpu_cores = \"8\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                         preview: true,
                         autostart: false,
                         cache: true
                });
		hf2search = new SearchManager({
                         id: "hf2",
                         search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"HeavyForwarder2\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"16 GB\"| eval os = \"Linux\"| eval splunk_component = \"Heavy Forwarder\"| eval cpu_cores = \"8\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                         preview: true,
                         autostart: false,
                         cache: true
                });
		dssearch = new SearchManager({
                         id: "ds",
                         search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"DeploymentServer\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"16 GB\"| eval os = \"Linux\"| eval splunk_component = \"Deployment Server\"| eval cpu_cores = \"8\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                         preview: true,
                         autostart: false,
                         cache: true
                });
		//spInfraTokens("DeploymentServer", "53.xx.xxx.xxx", "0.5 TB", "8 GB", "Linux", "Deployment Server", "8");
		
		if (indexers > 1) {
			cmsearch = new SearchManager({
                        	 id: "cm",
                        	 search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"ClusterMaster\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"16 GB\"| eval os = \"Linux\"| eval splunk_component = \"Cluster Master\"| eval cpu_cores = \"8\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                        	 preview: true,
                        	 autostart: false,
                        	 cache: true
                	});
		}
		for (i = 0; i < indexers; i++) { 
			idxsearch[i] = new SearchManager({
                        	 id: "idx"+i,
                        	 search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"Indexer"+(i+1)+"\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \""+($('[name="form_totalstorage"]').val()/indexers) +" TB\"| eval ram = \"64 GB\"| eval os = \"Linux\"| eval splunk_component = \"Indexer\"| eval cpu_cores = \"24\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                        	 preview: true,
                        	 autostart: false,
                        	 cache: true
                	});
		}
		//console.log(idxsearch);
		if (shs > 1) {
			depsearch = new SearchManager({
                        	 id: "dep",
                        	 search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"Deployer\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"16 GB\"| eval os = \"Linux\"| eval splunk_component = \"Deployer\"| eval cpu_cores = \"8\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                        	 preview: true,
                        	 autostart: false,
                        	 cache: true
                	});
		}
		for (i = 0; i < shs; i++) { 
			shssearch[i] = new SearchManager({
                        	 id: "shs"+i,
                        	 search: "| inputlookup dm_splunk_infra_lookup | append [stats count| eval demand_id ="+demand_id+"| eval provisioned_hostname =\"SearchHead"+(i+1)+"\" | eval provisioned_ip = \"53.xx.xxx.xxx\"| eval storage_tb = \"0.5 TB\"| eval ram = \"32 GB\"| eval os = \"Linux\"| eval splunk_component = \"Search Head\"| eval cpu_cores = \"16\" ] | table demand_id, provisioned_hostname, provisioned_ip, storage_tb, ram, os, splunk_component, cpu_cores| outputlookup dm_splunk_infra_lookup",
                        	 preview: true,
                        	 autostart: false,
                        	 cache: true
                	});
		}
		spInfraCleanSearch.startSearch();
		spInfraCleanSearch.on('search:done', function() {
			console.log('cleanup completed');
        	        hf1search.startSearch();
			//spInfraTokens();
        	});
		hf1search.on('search:done', function() {
			console.log('hf1 completed');
                	spinfraTableSearch.startSearch();
        	        hf2search.startSearch();
			//spInfraTokens();
        	});
		hf2search.on('search:done', function() {
			console.log('hf2 completed');
                	spinfraTableSearch.startSearch();
        	        dssearch.startSearch();
			//spInfraTokens();
        	});
		dssearch.on('search:done', function() {
			console.log('ds completed');
        	        if (indexers > 1) {
				console.log('start cmsearch');
                		spinfraTableSearch.startSearch();
				cmsearch.startSearch();
				cmsearch.on('search:done', function() {
					console.log('cm completed');
					console.log('start idxsearch[0]');
                			spinfraTableSearch.startSearch();
        			        idxsearch[0].startSearch();
        			});
			} else {
				console.log('start idxsearch[0]');
                		spinfraTableSearch.startSearch();
				idxsearch[0].startSearch();
				idxsearch[0].on('search:done', function() {
					console.log('idx0 completed');
					console.log('start shssearch[0]');
                			spinfraTableSearch.startSearch();
					shssearch[0].startSearch();
				});
			}
        	});
		
		for (var i=1; i<indexers; i++) {
			//var local1 = i;
			//myFunctions[i] = createMyFunction(i);
			temp = function(j) {
				return function() {
					console.log('in to register idx['+(i-1)+']');
					return idxsearch[j-1].on('search:done', function() {
						console.log('idx'+(j-1)+' completed');
						console.log('start idxsearch['+j+']');
                				spinfraTableSearch.startSearch();
						idxsearch[j].startSearch();
					});
				}();
			}(i);
		}
		
		if (shs > 1) {
                        console.log('register idx['+(i-1)+']');
			var local2 = i;
                        idxsearch[i-1].on('search:done', function() {
                                console.log('idx'+(local2-1)+' completed');
                                console.log('start depsearch');
                		spinfraTableSearch.startSearch();
                        	depsearch.startSearch();
                        });
                        console.log('register deployer');
			depsearch.on('search:done', function() {
				console.log('deployer completed');
				console.log('start shssearch[0]');
                		spinfraTableSearch.startSearch();
        		        shssearch[0].startSearch();
        		});
                } else {
                        console.log('register idx['+(i-1)+']');
			var local3 = i;
                        idxsearch[i-1].on('search:done', function() {
                                console.log('idx'+(local3-1)+' completed');
                                console.log('start shssearch[0]');
                		spinfraTableSearch.startSearch();
                        	shssearch[0].startSearch();
                        	console.log('register shs[0]');
				shssearch[0].on('search:done', function() {
					console.log('shs0 completed');
                			spinfraTableSearch.startSearch();
					//spInfraTokens();
				});
                	});
                }
		for (var k=1; k<shs; k++) {
                        temp = function(l) {
			return function () {
				console.log('register shs['+(l-1)+']');
				return shssearch[l-1].on('search:done', function() {
					console.log('shs'+(l-1)+' completed');
					console.log('start shssearch['+l+']');
                			spinfraTableSearch.startSearch();
					shssearch[l].startSearch();
				});
			}();
			}(k);
		}
                console.log('register shs['+(k-1)+']');
		var local5 = k;
		shssearch[k-1].on('search:done', function() {
                        console.log('shs'+(local5-1)+' completed');
                        spinfraTableSearch.startSearch();
                	spInfraTokens();
			console.log("Running SpInfra Search");
                });

	});
	createSpInfra.on('search:done', function() {
		console.log('createspinfra completed');
                spinfraTableSearch.startSearch();
                tokens.unset('tok_sp_create');
        });
	spinfraTable.on('click', function(e) {
                e.preventDefault();
	});
		
        $(document).on('click', '#submitButton', function(e) {
                e.preventDefault();
		var errors = 0;
		$("#demand :input").map(function(){
			if( !$(this).val() ) {
				$(this).parents('div').addClass('error-response');
				console.log($(this));
				errors++;
			} else if ($(this).val()) {
				$(this).parents('div').removeClass('error-response');
			}   
		});
		if(errors > 2){
			$('#errorwarn').addClass('error-response');
			$('#errorwarn').text("All fields are required");
			return false;
		}
		if ($('[name="demand_key"]').val() != ''){
			tokens.set('tok_update_demand', true);
			//demand_id = $('[name="form_demand_id"]').val();
			tokens.set('tok_demand_id', $('[name="form_demand_id"]').val());
			//tokens.set('tok_request_date', (new Date()));
			//tokens.set('tok_request_date', parseInt((new Date($('[name="form_request_date"]').val())).getTime()/1000));
			tokens.set('tok_plant_id', $('[name="form_plant_id"]').val());
			tokens.set('tok_primary_contact', $('[name="form_primary_contact"]').val());
			tokens.set('tok_primary_contact_email', $('[name="form_primary_contact_email"]').val());
			tokens.set('tok_secondary_contact', $('[name="form_secondary_contact"]').val());
			tokens.set('tok_secondary_contact_email', $('[name="form_secondary_contact_email"]').val());
			tokens.set('tok_business_unit', $('[name="form_business_unit"]').val());
			tokens.set('tok_iso_contact', $('[name="form_iso_contact"]').val());
			tokens.set('tok_cism_group_name', $('[name="form_cism_group_name"]').val());
			tokens.set('tok_demand_summary', $('[name="form_demand_summary"]').val());
			tokens.set('tok_main_objectives', $('[name="form_main_objectives"]').val());
			//tokens.set('tok_business_priority', $('[name="form_business_priority"]:checked').val());
			//tokens.set('tok_business_priority_comment', $('[name="form_business_priority_comment"]').val());
			//tokens.set('tok_business_risk', $('[name="form_business_risk"]:checked').val());
			//tokens.set('tok_business_risk_comment', $('[name="form_business_risk_comment"]').val());
			tokens.set('tok_requested_delivery_date', parseInt((new Date($('[name="form_requested_delivery_date"]').val())).getTime()));
			tokens.set('tok_funding_cost_center', $('[name="form_funding_cost_center"]').val());
			tokens.set('tok_business_domain', $('[name="form_business_domain"]').val());
			//tokens.set('tok_asset_inventory_upload', $('[name="form_asset_inventory_upload"]').val());
			//tokens.set('tok_usecases', $('[name="form_usecases"]').val());
			//tokens.set('tok_confidentiality', $('[name="form_confidentiality"]:checked').val());
			//tokens.set('tok_integrity', $('[name="form_integrity"]:checked').val());
			//tokens.set('tok_availability', $('[name="form_availability"]:checked').val());
			tokens.set('tok_additional_statements', $('[name="form_additional_statements"]').val());
			tokens.set('tok_demand_key', $('[name="demand_key"]').val());
			infraTableSearch = new SearchManager({
                	         id: "search1",
                	         search: "|inputlookup dm_infra_lookup | search demand_id="+demand_id +" | eval Update=\"Update\" |eval Delete=\"Delete\"|table *, Update, Delete",
                	         preview: true,
                	         autostart: false,
                	         cache: true

                	});
		} else {
			tokens.set('tok_create_demand', true);
			tokens.set('tok_demand_id', $('[name="form_demand_id"]').val());
			tokens.set('tok_plant_id', $('[name="form_plant_id"]').val());
                        tokens.set('tok_primary_contact', $('[name="form_primary_contact"]').val());
                        tokens.set('tok_primary_contact_email', $('[name="form_primary_contact_email"]').val());
                        tokens.set('tok_secondary_contact', $('[name="form_secondary_contact"]').val());
                        tokens.set('tok_secondary_contact_email', $('[name="form_secondary_contact_email"]').val());
                        tokens.set('tok_business_unit', $('[name="form_business_unit"]').val());
                        tokens.set('tok_iso_contact', $('[name="form_iso_contact"]').val());
                        tokens.set('tok_cism_group_name', $('[name="form_cism_group_name"]').val());
                        tokens.set('tok_demand_summary', $('[name="form_demand_summary"]').val());
                        tokens.set('tok_main_objectives', $('[name="form_main_objectives"]').val());
			tokens.set('tok_requested_delivery_date', parseInt((new Date($('[name="form_requested_delivery_date"]').val())).getTime()));
                        tokens.set('tok_funding_cost_center', $('[name="form_funding_cost_center"]').val());
                        tokens.set('tok_business_domain', $('[name="form_business_domain"]').val());
			tokens.set('tok_additional_statements', $('[name="form_additional_statements"]').val());
                        infraTableSearch = new SearchManager({
                                 id: "search1",
                                 search: "|inputlookup dm_infra_lookup | search demand_id="+demand_id +" | eval Update=\"Update\" |eval Delete=\"Delete\"|table *, Update, Delete",
                                 preview: true,
                                 autostart: false,
                                 cache: true

                        });
		}
        });

        createDemand.on('search:done', function() {
		tokens.unset('tok_create_demand');
                $('#demand *').filter(':input').each(function(){
                        $(this).prop('disabled',true);
                });
		infraTableSearch.startSearch();
        });
        updateDemand.on('search:done', function() {
		tokens.unset('tok_update_demand');
                $('#demand *').filter(':input').each(function(){
                        $(this).prop('disabled',true);
                });
		infraTableSearch.startSearch();
        });
        /*$("input[name='form_product_platform']").on('input', function(e){
        	platform_selected = $(this).val();
        });*/
		
        $("input[name='form_product_platform']").on('keyup change',function(){
        	mf = gbMultiplier($(this).val());
		total = isNaN(parseInt($('[name="form_no_of_devices"]').val() * mf)) ? 0 :(mf* $('[name="form_no_of_devices"]').val())
		$('[name="form_estd_log_size_gb"]').val(total);
        });
	
        $("input[name='form_no_of_devices']").on('keyup change',function(){
        	mf = gbMultiplier($('[name="form_product_platform"]').val());
		total = isNaN(parseInt($('[name="form_no_of_devices"]').val() * mf)) ? 0 :(mf* $('[name="form_no_of_devices"]').val())
		$('[name="form_estd_log_size_gb"]').val(total);
        });
	$(document).on('click', '#addDevice', function(e) {
                e.preventDefault();
                if ($('[name="infra_key"]').val() != ''){
			tokens.set('tok_update', 'true');
                        tokens.set('tok_demand_id', demand_id);
                        //tokens.set('tok_product_platform', platform_selected);
                        tokens.set('tok_product_platform', $('[name="form_product_platform"]').val());
                        tokens.set('tok_version', $('[name="form_version"]').val());
                        tokens.set('tok_no_of_devices', $('[name="form_no_of_devices"]').val());
                        tokens.set('tok_device_type', deviceType);
                        tokens.set('tok_estd_log_size_gb',$('[name="form_estd_log_size_gb"]').val());
                        tokens.set('tok_infra_key',$('[name="infra_key"]').val());
			
		} else {
			tokens.set('tok_create', 'true');
			tokens.set('tok_demand_id', demand_id); 
                	tokens.set('tok_product_platform', $('[name="form_product_platform"]').val());
                	tokens.set('tok_version', $('[name="form_version"]').val());
                	tokens.set('tok_no_of_devices', $('[name="form_no_of_devices"]').val());
			tokens.set('tok_device_type', deviceType);
                        tokens.set('tok_estd_log_size_gb',$('[name="form_estd_log_size_gb"]').val());
		}
        });
	createDemandInfra.on('search:done', function() {
		infraTableSearch.startSearch();
                $('#infra *').filter(':input').each(function(){
                        $(this).val('');
                });
		tokens.unset('tok_create');
        });
	updateDemandInfra.on('search:done', function() {
		infraTableSearch.startSearch();
                $('#infra *').filter(':input').each(function(){
                        $(this).val('');
                });
		tokens.unset('tok_update');
        });
	deleteDemandInfra.on('search:done', function() {
                infraTableSearch.startSearch();
		tokens.unset('tok_delete_key');
        });
	infraTable.on('click', function(e) {
		e.preventDefault();
		if(e['field'] === 'Update') {
			$('[name="form_demand_id"]').val(e.data['row.demand_id']);
			$('[name="form_product_platform"]').val(e.data['row.product_platform']);
			$('[name="form_version"]').val(e.data['row.version']);
			$('[name="form_no_of_devices"]').val(e.data['row.no_of_devices']);
			$('[name="infra_key"]').val(e.data['row._key']);
		} else if(e['field'] === 'Delete') {
                        tokens.set('tok_delete_key', e.data['row._key']);
                }
	});
});

//# sourceURL=crud_set_types.js
