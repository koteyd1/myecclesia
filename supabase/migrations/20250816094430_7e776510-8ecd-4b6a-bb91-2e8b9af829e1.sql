-- Update the third blog post with proper HTML formatting 
UPDATE blog_posts 
SET content = '<p>✨ <strong>Christian Events You Don''t Want to Miss in the UK (Aug–Dec 2025)</strong></p>

<p>So far in 2025, the UK has hosted hundreds of Christian events across denominations—from intimate retreats to large-scale festivals. As summer fades into autumn, the UK''s Christian calendar is just heating up. We are nearing the end of 2025 but don''t worry MyEcclesia has you covered with a beautiful blend of Catholic, Orthodox, and Protestant experiences 😉</p>

<p>Whether you''re drawn to liturgical depth, charismatic worship, or ecumenical unity, the UK offers a vibrant tapestry of Christian events in 2025. Here''s a curated list that reflects the breadth of the Body of Christ:</p>

<h2>📅 Christian Events in the UK – August to December 2025</h2>

<h3>🎶 Big Church Festival</h3>
<p><strong>📍 West Sussex 📅 22–24 August 🏷️ Ecumenical / Protestant</strong></p>
<p>Held at Wiston Estate, this is the UK''s largest Christian music festival. Expect sunrise worship, late-night praise, and performances from global artists like Brandon Lake and Israel Houghton. Family-friendly with creative zones, kids'' ministry, and food courts.</p>
<p>🔗 <a href="https://bigchurchfestival.com/" target="_blank">https://bigchurchfestival.com/</a></p>

<h3>🛐 David''s Tent</h3>
<p><strong>📍 Wiltshire 📅 22–25 August 🏷️ Ecumenical / Charismatic</strong></p>
<p>A 72-hour non-stop worship gathering at Charlton Park. Thousands gather across denominations to seek Jesus with no agenda but adoration. Includes breakout sessions, camping, and ministry from artists like Jonathan & Melissa Helser.</p>
<p>🔗 <a href="https://www.davidstent.net/" target="_blank">https://www.davidstent.net/</a></p>

<h3>🎨 Paint N Praise Gospel Sip & Paint</h3>
<p><strong>📍 London 📅 23 August 🏷️ Ecumenical / Creative</strong></p>
<p>A vibrant Christian creative experience for ages 21+. Paint the fruits of the Spirit while grooving to gospel beats. Includes guided painting, games, networking, and a gospel DJ. Hosted by Faith-Links.</p>
<p>🔗 <a href="https://myecclesia.co.uk/events/paint-n-praise-london-gospel-sip-paint-1" target="_blank">Event Details</a></p>

<h3>🎼 Divine Exchange Intl. Conference & Music Concert</h3>
<p><strong>📍 Leeds 📅 23 August 🏷️ Catholic / Charismatic</strong></p>
<p>Celebrating 15 years of ministry, this free event features Nigerian gospel artists like Ebuka Songs and Naomi Classik. Hosted by Divine Exchange Christian Centre, it blends worship, teaching, and cultural celebration.</p>
<p>🔗 <a href="https://myecclesia.co.uk/events/divine-exchange-international-conference-music-concert-2025-2" target="_blank">Event Details</a></p>

<h3>🌍 TogetherFest 2025</h3>
<p><strong>📍 London 📅 24 August 🏷️ Ecumenical / Youth</strong></p>
<p>A free gospel concert hosted by Alive City Church at The City Academy, Hackney. Featuring Volney Morgan & New-Ye, Day Three Music, and more. Expect passionate worship, community vibes, and powerful messages of hope.</p>
<p>🔗 <a href="https://myecclesia.co.uk/events/togetherfest-2025" target="_blank">Event Details</a></p>

<h3>🔥 Young & Chosen 2.0 – Limoblaze Live</h3>
<p><strong>📍 London 📅 30 August 🏷️ Protestant / Afro-Gospel</strong></p>
<p>The UK''s biggest Afrogospel concert returns to The Roundhouse. Headlined by Limoblaze, with support from Andy Mineo, Joe L Barnes, and Kaestrings. A celebration of faith, identity, and urban gospel culture.</p>
<p>🔗 <a href="https://www.skiddle.com/whats-on/London/The-Roundhouse-Theatre/Young--Chosen-20-Limoblaze-Live-in-London/40576831/" target="_blank">Event Details</a></p>

<h3>🕊️ 1700th Anniversary of the First Council of Nicaea</h3>
<p><strong>📍 Focolare Centre, Welwyn Garden City 📅 27–30 November 2025 🏷️ Orthodox / Ecumenical / Theological Formation</strong></p>
<p>This special conference marks the 1700th anniversary of the First Council of Nicaea (325 AD), a foundational moment for Christian orthodoxy. Hosted by the Focolare Community, the event brings together Orthodox, Catholic, and Protestant leaders to reflect on the Nicene Creed, the nature of Christ, and the unity of the Church. Expect liturgical celebrations, theological panels, and spiritual formation rooted in ancient tradition and contemporary dialogue.</p>
<p>🔗 <a href="https://www.birminghamchurches.org.uk/east-and-west/" target="_blank">Event Details</a></p>

<h3>🎤 Mission Worship Conference</h3>
<p><strong>📍 Eastbourne 📅 21–23 November 🏷️ Protestant / Worship Leaders</strong></p>
<p>A multi-denominational worship conference under the theme "Every Generation." Includes worship, seminars, and practical training for musicians, pastors, and creatives.</p>
<p>🔗 <a href="https://www.missionworship.com/" target="_blank">https://www.missionworship.com/</a></p>

<h3>🙏 Advent Retreat – Diocese of Westminster</h3>
<p><strong>📍 London 📅 7 December 🏷️ Catholic / Contemplative</strong></p>
<p>A contemplative retreat in preparation for Christmas. Includes Advent reflections, lectio divina, and traditional Catholic spirituality practices.</p>

<p><strong>Ready to join the movement?</strong> Find these events and hundreds more on MyEcclesia, where faith meets community. Whether you''re looking for worship, fellowship, or spiritual growth, the UK''s Christian community has something beautiful waiting for you.</p>

<p>🔗 <a href="https://myecclesia.co.uk/events" target="_blank">Explore all events on MyEcclesia</a></p>'
WHERE id IN (
    SELECT id FROM blog_posts 
    WHERE published = true 
    AND id NOT IN ('2bab5b97-fed4-41a5-a3a4-526e6b82857a', 'ee4baf79-f3c1-4d22-ae4c-8ef03c69feb9')
    LIMIT 1
);