import java.io.File

tasks.register("modifyHtml") {
    doLast {
        val file = file("src/main/assets/LMSA/index.html")
        var content = file.readText()
        content = content.replace("id=\"native-ad-placeholder\" class=\"w-full mt-3", "id=\"native-ad-placeholder\" class=\"w-full mt-6")
        file.writeText(content)
        println("Replaced mt-3 with mt-6")
    }
}