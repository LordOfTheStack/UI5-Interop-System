# Interop 
## Routing and Event System for SAP/Open UI5

This is a library for UI5 that allows many instances of UI5 applications to run simultaneously, integrated or independently of each other in sub-containers (side by side, or embedded)
Container applications can register their container locations so that any app can navigate to a chosen container (eg: Left/Right/Header/Footer/Main/Master/Other)
This class also provides methods for communicating between those applications (simplified version of EventBus, for ease of use)

Basically, you can use this to compare two client records (instantiate the same fiori view twice, side by side, with different route params)
Or even run completely different applications independently in the same window (for example, your Inbox in a side or top panel, so you can keep track of your job queue at all times)

All apps that run this way, can be built in the usual UI5 way with standard routers
So all of your existing UI5 apps can be run in containers
(But, if you are using global variables or .getCore you might be in trouble, these are practises that should be avoided anyway though)

## Classes

Classes
dalrae.ui5.routing.Interop : this class is where the magic happens, you will use it to raise and listen to events, and perform container navigations
dalrae.ui5.routing.Container : this is a UI element you can use in your XML views, this is the quickest and easiest way to setup a container page for your applications to run inside of
dalrae.ui5.BaseController : this is a base controller that your apps controllers must inherit to make proper use of all of Interops features (you could also just read over this and incorporate its code into your own base)
dalrae.ui5.BaseComponent : (optional) this is a base component that your apps component can inherit
dalrae.ui5.util.Functions : just has some functions in it, utilised by Interop
dalrae.ui5.util.jQuery : just has a few jQuery extensions in it, utilised by Interop

Interop class has jsdoc style comments included on most public functions, have a read through

## Samples

A working sample is included, it contains three UI5 applications
sample.container : a sample container app, complete with Master/Detail/Right/Header/InnerRight panels for navigation, and the option for users to shift content between the Main and Right hand panels 
sample.demoapp1 : just a normal split app Master/Detail using a static json model for data
sample.demoapp2 : a nothing app, just used to demonstrate that app1 to navigate to app2 and run at the same times

Both demo apps can run in standalone mode (from their own Index)
demonstrating the fallback logic of Interop, and how the standard fiori pattern is not deviated from

to see the containers in action launch /container/index.html
to prove that the apps aren't dependant on interop to run and can still run standalone like a normal UI5 app, launch /demoapp1/index.html

## Environment

Interop is designed to work on both ERP/Gateway/Launchoad as well as HANA and standard webservers 
However, fallback routing features are incomplete for Gateway, and it has not been tested on Hana+Launchpad yet

Tested successfully on IIS (standard webserver)
Tested successfully on HCP (Hana Trial Account)
Older version tested on CRM, but I haven't had access to a system to retest in awhile

## TODO

- I've heard whispers of a Hana Launchpad, need to test compatibility with that
- Need to retest on ERP/CRM and enhance fallback routing to work with it

## Contributing

If you have made some awesome enhancements, please let me know / make a pull request!

## Authors

* **Phillip Smith** - [Lord of the Stack] https://people.sap.com/lordofthestack  

## License

This project is licensed under the MIT License

