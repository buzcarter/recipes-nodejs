# The `.menu` Recipe List File Format

The `.menu` file format is a text-based list of recipe URLs. Metadata about the list itself and each recipe is optional. A `.menu` file can be used to conveniently and consistently organize recipe links from various sources for different purposes, such as: putting together a holiday menu, keeping a list of the recipes you’ve tried (or want to try), or sharing your “best of” with friends.

The `.menu` file format is inspired by the `.m3u` music playlist format ("m3u" is short for "MP3 URLs"). This is why all the "directives" (see below) begin with `#EXT`, the designation for a non-standard extension to the format.

## Naming Conventions

The .menu file extension indicates that the file contains data related to a menu, which is a collection of recipes that are suitable for a specific occasion, such as a dinner party, a picnic, a holiday, etc. The file name can be anything that describes the menu, such as the theme, the occasion, the number of recipes, etc. For example, a file named "valentines-day.menu" could contain recipes for a romantic dinner for two.

## File Format

* Every piece of information in a `.menu` file must appear on a separate line.
* Blank lines will be ignored and can be used to separate different sections or recipes in the file.
* Lines that do not follow the syntax of the file format will be ignored.
    * If you wish to leave yourself a note or comment that will be ignored start the line with a `#` symbol followed by a space, i.e. `# Ask Linda for her sweet potato recipe!!!`.
* Except for `#EXTMENU`, which must be the first line of the file, all other "directives" (`#EXT...`) are optional.
* A URL is a line that contains a web address that points to a recipe web page. A URL can be absolute or relative, depending on the source of the recipe. If a relative URL is used the `.html` file extension will be assumed.
* The order of directives does not matter.

## Describing the Menu

* The first line of a `.menu` file must be `#EXTMENU`, which indicates the start of the menu.
* `#EXTTITLE` (optional) if present this will be used as the menu's title, otherwise the title will be inferred from the filename, ex. `#EXTTITLE: Never-fail, Go-To, Crowd Pleasing Bakes!`
* `#EXTIMG` (optional) a thumbnail image URL, ex. `#EXTIMG: ./images/Christmas2023CookieExchange.jpg`
* `#EXTDESC` (optional) description, ex. `#EXTDESC: A festive menu of 12 delicious baked goods, perfect for gifting.`
* `#EXTAUTH` (optional) author, ex. `#EXTAUTH: Jane Doe, janedoesbakes@github.com`
* `#EXTDATE` (optional) date, ex. `#EXTDATE: December 2023`
* `#EXTINFO` (optional) additional information, ex. `#EXTINFO: Kid-helper friendly, no experience necessary.`

## Describing Recipes

* recipe URL. This begins a single recipe block and is the only required field. After the URL include any optional metadata ("directive"). The order of these directives does not matter, as long as they appear after the URL.
* `#EXTRATING` (optional) Your rating, whether 1 to 5 stars, a scale of 1 to 10, or just a description ("awesome"), ex. `#EXTRATING: 5 stars`
* `#EXTINFO` (optional) additional information, ex. `#EXTINFO: First made this for Ludlow's birthday in 2006 and we've been making it regularly ever since!`

## Example Usage

Here is an example `.menu` file that contains three recipes for a festive menu of baked goods:

```yaml
#EXTMENU
#EXTTITLE: Never-fail, Go-To, Crowd Pleasing Bakes!
#EXTIMG: ./images/Christmas2023CookieExchange.jpg
#EXTDESC: A festive menu of 12 delicious baked goods that are perfect for gifting. From cookies and cakes to pies and breads, recipes that'll fill your home with holiday smells no one can resist.
#EXTAUTH: Jane Doe, janedoesbakes@github.com
#EXTDATE: December 2023
#EXTINFO: Kid-helper friendly, no experience necessary.

https://www.101amazingzombiebakes.com/chocolate-chip-cookies
#EXTRATING: 4.5 stars
#EXTINFO: A bit fussy, but worth the effort and stores well for up to a week.

https://altonbrown.com/recipes/ice-box-banana-pudding
#EXTRATING: 5 stars
#EXTINFO: First made this for Ludlow's birthday in 2006 and we've been making it regularly ever since!

./apple-pie.html

```

## Technical Specification

### Internal JSON Representation

```json
{
    "version": "menu#1.0.0",
    // JSON Schema here!
    "filePath": "./my-holiday-bakes.menu",
    "title": "Never-fail, Go-To, Crowd Pleasing Bakes!",
    "imgURL": "./images/Christmas2023CookieExchange.jpg",
    "description": "A festive menu of 12 delicious baked goods that are perfect for gifting. From cookies and cakes to pies and breads, recipes that'll fill your home with holiday smells no one can resist.",
    "author": "Jane Doe, janedoesbakes@github.com",
    "date": "December 2023",
    "info": "Kid-helper friendly, no experience necessary.",
    "recipes": [{
        "url": "https://www.101amazingzombiebakes.com/chocolate-chip-cookies",
        "rating": "4.5 stars",
        "info": "A bit fussy, but worth the effort and stores well for up to a week."
    }, {
        "url": "https://altonbrown.com/recipes/ice-box-banana-pudding",
        "rating": "5 stars",
        "info": "First made this for Ludlow's birthday in 2006 and we've been making it regularly ever since!"
    }, {
        "url": "./apple-pie.html"
    }]
}
```
