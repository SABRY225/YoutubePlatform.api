const Video = require('../models/videoModel');
const Playlist = require('../models/playlistModel');
const Like = require('../models/likeModel')
// Get all videos by user id
const getVideos = async (req, res) => {
    try {

        const videos = await Video.find({ userId: req.params.userId }).populate('userId').populate('categoryId');
        res.status(200).json(videos.map(video => ({
            id: video._id,
            videoUrl: video.videoUrl,
            backImgVideoUrl: video.backImgVideoUrl,
            title: video.title,
            views: video.views,
            userName: video.userId.userName,
            userId: video.userId._id,
            profilePicture: video.userId.profilePicture,
            categoryName: video.categoryId.name
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching videos', error });
    }
};

const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find().populate('userId').populate('categoryId');
        res.status(200).json(videos.map(video => ({
            id: video._id,
            videoUrl: video.videoUrl,
            backImgVideoUrl: video.backImgVideoUrl,
            title: video.title,
            views: video.views,
            userName: video.userId.userName,
            userId: video.userId._id,
            profilePicture: video.userId.profilePicture,
            categoryName: video.categoryId.name
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching videos', error });
    }
};

// Get a specific video by ID
const getVideo = async (req, res) => {
    const { videoId } = req.params;
    const { userId } = req.userId;
    try {
        const video = await Video.findById(videoId).populate('userId').populate('categoryId');
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        const countLike = await Like.countDocuments({ videoId: video._id });
        const filteredVideos = {
            id: video._id,
            title: video.title,
            videoUrl: video.videoUrl,
            description: video.description,
            views: video.views,
            channelId: video.userId._id,
            channelName: video.userId.userName,
            channelImg: video.userId.profilePicture,
            categoryId: video.categoryId._id,
            categoryName: video.categoryId.name,
            countLike
        };

        res.status(200).json(filteredVideos);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching video', error });
    }
};

// Create a new video
const createVideo = async (req, res) => {
    const { categoryId } = req.params
    const userId = req.userId
    const { title, description, videoUrl, backImgVideoUrl } = req.body;
    try {
        const newVideo = new Video({ title, description, videoUrl, backImgVideoUrl, userId, categoryId });
        await newVideo.save();
        res.status(201).json({ message: 'creating video successfully', success: true });
    } catch (error) {
        res.status(400).json({ message: 'Error creating video', success: false });
    }
};

// Update a video by ID
const updateVideo = async (req, res) => {
    const { videoId } = req.params;
    const { title, description, videoUrl, backImgVideoUrl } = req.body;
    try {
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { title, description, videoUrl, backImgVideoUrl },
            { new: true }
        ).populate('userId').populate('categoryId');
        if (!updatedVideo) {
            return res.status(404).json({ message: 'Video not found', success: false });
        }
        res.status(200).json({ message: "Update video successfully", success: true });
    } catch (error) {
        res.status(400).json({ message: 'Error updating video', error });
    }
};

// Delete a video by ID
const deleteVideo = async (req, res) => {
    const { videoId } = req.params;
    try {
        const deletedVideo = await Video.findByIdAndDelete(videoId);
        if (!deletedVideo) {
            return res.status(404).json({ message: 'Video not found', success: false });
        }
        res.status(200).json({ message: 'Video deleted successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};
// assign a video by ID
const assignVideo = async (req, res) => {
    try {
        // Find the playlist and video by their respective IDs
        const playlist = await Playlist.findById(req.params.playlistId);
        const video = await Video.findById(req.params.videoId);

        // Check if playlist or video exists
        if (!playlist || !video) {
            return res.status(200).json({ message: 'Playlist or Video not found', success: false });
        }

        // Check if the video already exists in the playlist
        const videoExists = playlist.videosId.includes(video._id);
        if (videoExists) {
            return res.status(200).json({ message: 'Video already exists in the playlist', success: false });
        }

        // Add video to the playlist and save the playlist
        playlist.videosId.push(video._id);
        await playlist.save();

        // Return the updated playlist
        return res.status(200).json({ message: `Video assign to the playlist ${playlist.name}`, success: true });

    } catch (error) {
        // Catch and return any errors
        return res.status(200).json({ message: error.message, success: false });
    }
};

const addViewVideo = async (req, res) => {
    const { videoId } = req.params;

    try {
        // تحديث عدد المشاهدات في قاعدة البيانات
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } },  // زيادة عدد المشاهدات بمقدار 1
            { new: true } // ارجاع الفيديو المحدث
        );

        if (!updatedVideo) {
            return res.status(404).json({ message: 'Video not found' });
        }

        res.status(200).json({message: 'Add view video'}); // إرسال الفيديو المحدث
    } catch (err) {
        res.status(500).json({ message:err.message });
    }
}

module.exports = {
    getVideos,
    getVideo,
    createVideo,
    updateVideo,
    deleteVideo,
    assignVideo,
    getAllVideos,
    addViewVideo
};
