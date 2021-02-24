# Watson\_Closed\_Captioning
The Bluemix Watson Speech To Text service produces json output with time markers,optional speaker markers, and other information. This utility produces Closed Captioning transcripts in your choice of SRT or VTT from the Watson Speech To Text results. You can take the resulting output and upload it to your streaming service using their API. Alternatively, output to a file and upload manually. Support for the optional Watson Smart Formatting was recently added.

>0  
>00:00:00,800 --> 00:00:04,110  
>my family absolute is fascinated by  
>   
>1  
>00:00:04,140 --> 00:00:07,230  
>the work I'm doing with Watson and I I  
>   
>2  
>00:00:07,230 --> 00:00:10,720  
>think they feel a personal sense of pride and satisfaction  
>   


## Usage
Two parameters. The first is the Watson STT service results in JSON format. 
Use the STT Final Results as input  
See [Watson Speech to Text](https://console.bluemix.net/docs/services/speech-to-text/index.html#about) for details on how to work with STT.


The second is a style block the allows the following settings:

* maxLineTime - The maximum amount of time in seconds for each frame of closed caption output. Default to 2 seconds
* suppressHesitations - Watson produces %HESITATION tags. Set this to true if you want to see them. Default false.
* outputStyle - Can be either "SRT" or "VTT". Default is "SRT". 
* suppressSpeakerLabels - Normally this outputs Speaker 0: Speaker 1: etc. at each speaker transition, if Watson STT produced that information. You can suppress the speaker tags by setting this to false. It will still do a line break at each speaker. Default is false.
* verbose - prints more stuff.

This can also be used as a node-red module


## Developing

see test.js for example

## Wishlist

Minor things I want to fix

### Tools

Created with [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   

Nodeclipse is free open-source project that grows with your contributions.
# Watson\_Closed\_Captioning
