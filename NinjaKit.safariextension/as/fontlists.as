package {
	import flash.display.Sprite;
	import flash.external.ExternalInterface;
	import flash.text.Font;
	public class fontlists extends Sprite {
		public function fontlists() {
			var fonts:Array = [];
			var allFonts:Array = Font.enumerateFonts(true);
			allFonts.sortOn("fontName", Array.CASEINSENSITIVE);
			for(var i:int=0;i<allFonts.length;i++){
				var f:Object = allFonts[i];
				fonts.push({name:f.fontName,type:f.fontType,style:f.fontStyle});
			}
			ExternalInterface.call('Fonts',fonts);
		}
	}
}
